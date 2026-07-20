import { describe, it, expect, beforeAll } from "vitest"
import { inventoryService } from "@/services/InventoryService"
import { productService } from "@/services/ProductService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("InventoryService (integração)", () => {
  let productId: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
    const { data: category } = await supabase.from("categories").select("id").eq("active", true).limit(1).single()
    const product = await productService.create({
      name: `Produto Estoque Vitest ${Date.now()}`,
      sku: `SKU-INV-${Date.now()}`,
      category_id: category!.id,
      sale_price: 10,
      minimum_stock: 5,
    })
    productId = product.id
  })

  it("Entrada aumenta o estoque atomicamente via RPC", async () => {
    const movement = await inventoryService.registerMovement({
      product_id: productId,
      movement_type: "Entrada",
      quantity: 50,
    })
    expect(movement.current_quantity).toBe(50)
    expect(movement.previous_quantity).toBe(0)
  })

  it("Saída maior que o saldo é bloqueada (nunca fica negativo)", async () => {
    await expect(
      inventoryService.registerMovement({ product_id: productId, movement_type: "Saída", quantity: 1000 })
    ).rejects.toBeTruthy()
  })

  it("Inventário define o saldo absoluto", async () => {
    const movement = await inventoryService.registerMovement({
      product_id: productId,
      movement_type: "Inventário",
      quantity: 3,
    })
    expect(movement.current_quantity).toBe(3)
  })

  it("aparece no alerta de estoque baixo quando <= mínimo", async () => {
    const lowStock = await inventoryService.listLowStock()
    expect(lowStock.some((p) => p.id === productId)).toBe(true)
  })

  it("listMovements retorna o histórico com o produto relacionado", async () => {
    const result = await inventoryService.listMovements({ page: 1, limit: 10 })
    const found = result.data.find((m) => m.product_id === productId)
    expect(found?.product?.name).toBeTruthy()
  })

  it("o ledger é imutável: UPDATE/DELETE bloqueados até para admin", async () => {
    const { data: rows } = await supabase.from("inventory_movements").select("id").eq("product_id", productId).limit(1)
    const id = rows![0].id
    const upd = await supabase.from("inventory_movements").update({ quantity: 999 }).eq("id", id).select()
    expect(upd.data).toEqual([])
    const del = await supabase.from("inventory_movements").delete().eq("id", id).select()
    expect(del.data).toEqual([])
  })

  it("RLS: vendedor sem inventory.* não consegue registrar movimentação", async () => {
    const vendedor = await signInAs("vendedor")
    const { error } = await vendedor.rpc("register_inventory_movement", {
      p_product_id: productId,
      p_movement_type: "Entrada",
      p_quantity: 10,
      p_reference: null,
      p_observation: null,
    })
    expect(error).toBeTruthy()
  })
})
