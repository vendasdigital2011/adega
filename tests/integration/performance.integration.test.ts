import { describe, it, expect, beforeAll } from "vitest"
import { categoryService } from "@/services/CategoryService"
import { inventoryService } from "@/services/InventoryService"
import { productService } from "@/services/ProductService"
import { dashboardService } from "@/services/DashboardService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"

// Limiar generoso: a rede real até o Supabase (não um Postgres local) já
// impõe uma latência de base que varia por conexão. O objetivo é pegar uma
// query/RPC que ficou visivelmente lenta (ex.: um N+1 introduzido sem
// querer), não medir um SLA de produção.
const MAX_MS = 3_000

describe("Performance (integração)", () => {
  let productId: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
    const { data: category } = await supabase.from("categories").select("id").eq("active", true).limit(1).single()
    const product = await productService.create({
      name: `Produto Perf Vitest ${Date.now()}`,
      sku: `SKU-PERF-${Date.now()}`,
      category_id: category!.id,
      sale_price: 10,
      minimum_stock: 0,
    })
    productId = product.id
  })

  it("CategoryService.list() responde dentro do limiar", async () => {
    const start = Date.now()
    await categoryService.list({ page: 1, limit: 20 })
    expect(Date.now() - start).toBeLessThan(MAX_MS)
  })

  it("register_inventory_movement (RPC transacional) responde dentro do limiar", async () => {
    const start = Date.now()
    await inventoryService.registerMovement({ product_id: productId, movement_type: "Entrada", quantity: 10 })
    expect(Date.now() - start).toBeLessThan(MAX_MS)
  })

  it("DashboardService.getSummary() (7 queries em paralelo) responde dentro do limiar", async () => {
    const start = Date.now()
    await dashboardService.getSummary()
    expect(Date.now() - start).toBeLessThan(MAX_MS)
  })
})
