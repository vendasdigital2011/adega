import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { saleService } from "@/services/SaleService"
import { cashService } from "@/services/CashService"
import { productService } from "@/services/ProductService"
import { customerService } from "@/services/CustomerService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"

describe("SaleService (integração)", () => {
  let productId: string
  let customerId: string
  let registerId: string

  beforeAll(async () => {
    await loginAppClientAs("admin")

    const { data: category } = await supabase.from("categories").select("id").eq("active", true).limit(1).single()
    const product = await productService.create({
      name: `Produto Venda Vitest ${Date.now()}`,
      sku: `SKU-SALE-${Date.now()}`,
      category_id: category!.id,
      sale_price: 25,
      minimum_stock: 0,
    })
    productId = product.id
    // dá saldo pro produto conseguir ser vendido
    await supabase.rpc("register_inventory_movement", {
      p_product_id: productId,
      p_movement_type: "Entrada",
      p_quantity: 100,
      p_reference: null,
      p_observation: "setup teste de vendas",
    })

    const customer = await customerService.create({ name: `Cliente Venda Vitest ${Date.now()}` })
    customerId = customer.id

    const existing = await cashService.getOpenRegister()
    if (existing) await cashService.close(existing.id, existing.initial_value)
    registerId = await cashService.open(0)
  })

  afterAll(async () => {
    await cashService.close(registerId, 0)
  })

  it("venda não-fiado sem caixa aberto é bloqueada", async () => {
    await cashService.close(registerId, 0)
    await expect(
      saleService.create({
        customer_id: null,
        sale_date: new Date().toISOString().slice(0, 10),
        discount: 0,
        payment_method: "PIX",
        items: [{ product_id: productId, quantity: 1, unit_price: 25 }],
      })
    ).rejects.toBeTruthy()
    registerId = await cashService.open(0) // reabre pro resto da suíte
  })

  it("venda finalizada baixa estoque e gera movimentação de caixa", async () => {
    const { data: before } = await supabase.from("products").select("current_stock").eq("id", productId).single()

    const saleId = await saleService.create({
      customer_id: null,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "PIX",
      items: [{ product_id: productId, quantity: 3, unit_price: 25 }],
    })

    const { data: after } = await supabase.from("products").select("current_stock").eq("id", productId).single()
    expect(after!.current_stock).toBe(before!.current_stock - 3)

    const movements = await cashService.listMovements(registerId)
    expect(movements.some((m) => m.movement_type === "Entrada" && m.value === 75)).toBe(true)
  })

  it("venda além do saldo em estoque é bloqueada (nunca fica negativo)", async () => {
    await expect(
      saleService.create({
        customer_id: null,
        sale_date: new Date().toISOString().slice(0, 10),
        discount: 0,
        payment_method: "PIX",
        items: [{ product_id: productId, quantity: 99999, unit_price: 25 }],
      })
    ).rejects.toBeTruthy()
  })

  it("venda Fiado exige cliente e gera conta a receber, sem exigir caixa aberto", async () => {
    const saleId = await saleService.create({
      customer_id: customerId,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "Fiado",
      items: [{ product_id: productId, quantity: 1, unit_price: 25 }],
    })
    const { data: receivable } = await supabase
      .from("accounts_receivable")
      .select("id, amount, status")
      .eq("sale_id", saleId)
      .single()
    expect(receivable?.amount).toBe(25)
    expect(receivable?.status).toBe("Aberta")
  })

  it("cancelar uma venda estorna o estoque", async () => {
    const { data: before } = await supabase.from("products").select("current_stock").eq("id", productId).single()

    const saleId = await saleService.create({
      customer_id: null,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "PIX",
      items: [{ product_id: productId, quantity: 2, unit_price: 25 }],
    })
    await saleService.cancel(saleId)

    const { data: after } = await supabase.from("products").select("current_stock").eq("id", productId).single()
    expect(after!.current_stock).toBe(before!.current_stock) // baixou 2, estornou 2

    const { data: sale } = await supabase.from("sales").select("status").eq("id", saleId).single()
    expect(sale?.status).toBe("cancelada")
  })

  it("getItems retorna os itens da venda com o produto relacionado", async () => {
    const saleId = await saleService.create({
      customer_id: null,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "Dinheiro",
      items: [{ product_id: productId, quantity: 1, unit_price: 25 }],
    })
    const items = await saleService.getItems(saleId)
    expect(items).toHaveLength(1)
    expect(items[0].product?.name).toBeTruthy()
  })

  it("list() filtra por status e traz o cliente relacionado", async () => {
    const result = await saleService.list({ status: "finalizada", page: 1, limit: 5 })
    expect(result.data.every((s) => s.status === "finalizada")).toBe(true)
  })
})
