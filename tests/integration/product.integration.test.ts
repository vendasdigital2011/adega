import { describe, it, expect, beforeAll } from "vitest"
import { productService } from "@/services/ProductService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("ProductService (integração)", () => {
  let categoryId: string
  let createdId: string
  const uniqueSku = `SKU-VITEST-${Date.now()}`

  beforeAll(async () => {
    await loginAppClientAs("admin")
    const { data } = await supabase.from("categories").select("id").eq("active", true).limit(1).single()
    categoryId = data!.id
  })

  it("cria um produto mínimo válido, com join de categoria/marca", async () => {
    const created = await productService.create({
      name: "Produto Teste Vitest",
      sku: uniqueSku,
      category_id: categoryId,
      sale_price: 19.9,
      minimum_stock: 5,
    })
    expect(created.id).toBeTruthy()
    expect(created.current_stock).toBe(0)
    expect(created.category?.name).toBeTruthy()
    createdId = created.id
  })

  it("rejeita SKU duplicado", async () => {
    await expect(
      productService.create({
        name: "Outro Produto",
        sku: uniqueSku,
        category_id: categoryId,
        sale_price: 10,
        minimum_stock: 0,
      })
    ).rejects.toMatchObject({ code: "DUPLICATE_SKU" })
  })

  it("normaliza brand_id vazio para null", async () => {
    const updated = await productService.update(createdId, { brand_id: "" })
    expect(updated.brand_id).toBeNull()
  })

  it("desativa e reativa", async () => {
    await productService.setActive(createdId, false)
    const reactivated = await productService.setActive(createdId, true)
    expect(reactivated.active).toBe(true)
  })

  it("lista produtos com busca por nome/sku/barcode e filtro de categoria", async () => {
    const bySku = await productService.list({ search: uniqueSku, page: 1, limit: 10 })
    expect(bySku.data.some((p) => p.id === createdId)).toBe(true)

    const byCategory = await productService.list({ categoryId, active: true, page: 1, limit: 10 })
    expect(byCategory.data.length).toBeGreaterThan(0)
  })

  it("normaliza preços/descrição vazios para null ao atualizar", async () => {
    const updated = await productService.update(createdId, { purchase_price: undefined, description: "" })
    expect(updated.description).toBeNull()
  })

  it("rejeita SKU duplicado também ao atualizar (não só ao criar)", async () => {
    const other = await productService.create({
      name: "Produto Update Dup Vitest",
      sku: `SKU-VITEST-OTHER-${Date.now()}`,
      category_id: categoryId,
      sale_price: 5,
      minimum_stock: 0,
    })
    await expect(productService.update(other.id, { sku: uniqueSku })).rejects.toMatchObject({ code: "DUPLICATE_SKU" })
  })

  it("RLS: vendedor sem products.view não lista produtos", async () => {
    const vendedor = await signInAs("vendedor")
    const { data, error } = await vendedor.from("products").select("id")
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
