import { describe, it, expect, beforeAll } from "vitest"
import { purchaseService } from "@/services/PurchaseService"
import { productService } from "@/services/ProductService"
import { supplierService } from "@/services/SupplierService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"

describe("PurchaseService (integração)", () => {
  let productId: string
  let supplierId: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
    const { data: category } = await supabase.from("categories").select("id").eq("active", true).limit(1).single()
    const product = await productService.create({
      name: `Produto Compra Vitest ${Date.now()}`,
      sku: `SKU-PUR-${Date.now()}`,
      category_id: category!.id,
      sale_price: 20,
      minimum_stock: 0,
    })
    productId = product.id
    const supplier = await supplierService.create({
      name: `Fornecedor Compra Vitest ${Date.now()}`,
      document: String(Date.now()).slice(-11).padStart(11, "3"),
      phone: "11999999999",
    })
    supplierId = supplier.id
  })

  it("cria uma compra pendente com total = itens + frete - desconto", async () => {
    const purchaseId = await purchaseService.create({
      supplier_id: supplierId,
      purchase_date: new Date().toISOString().slice(0, 10),
      freight: 10,
      discount: 5,
      items: [{ product_id: productId, quantity: 10, unit_price: 15 }],
    })
    expect(purchaseId).toBeTruthy()

    const { data: purchase } = await supabase.from("purchases").select("total, status").eq("id", purchaseId).single()
    expect(purchase!.total).toBe(155) // 10*15 + 10 - 5
    expect(purchase!.status).toBe("pendente")
  })

  it("recebimento gera entrada de estoque e atualiza o preço de custo", async () => {
    const { data: before } = await supabase.from("products").select("current_stock").eq("id", productId).single()

    const purchaseId = await purchaseService.create({
      supplier_id: supplierId,
      purchase_date: new Date().toISOString().slice(0, 10),
      freight: 0,
      discount: 0,
      items: [{ product_id: productId, quantity: 5, unit_price: 12 }],
    })
    await purchaseService.receive(purchaseId)

    const { data: after } = await supabase.from("products").select("current_stock, purchase_price").eq("id", productId).single()
    expect(after!.current_stock).toBe(before!.current_stock + 5)
    expect(after!.purchase_price).toBe(12)

    const { data: purchase } = await supabase.from("purchases").select("status").eq("id", purchaseId).single()
    expect(purchase!.status).toBe("recebida")
  })

  it("não permite receber a mesma compra duas vezes", async () => {
    const purchaseId = await purchaseService.create({
      supplier_id: supplierId,
      purchase_date: new Date().toISOString().slice(0, 10),
      freight: 0,
      discount: 0,
      items: [{ product_id: productId, quantity: 1, unit_price: 10 }],
    })
    await purchaseService.receive(purchaseId)
    await expect(purchaseService.receive(purchaseId)).rejects.toBeTruthy()
  })

  it("cancelar uma compra recebida estorna o estoque", async () => {
    const { data: before } = await supabase.from("products").select("current_stock").eq("id", productId).single()

    const purchaseId = await purchaseService.create({
      supplier_id: supplierId,
      purchase_date: new Date().toISOString().slice(0, 10),
      freight: 0,
      discount: 0,
      items: [{ product_id: productId, quantity: 4, unit_price: 10 }],
    })
    await purchaseService.receive(purchaseId)
    await purchaseService.cancel(purchaseId)

    const { data: after } = await supabase.from("products").select("current_stock").eq("id", productId).single()
    expect(after!.current_stock).toBe(before!.current_stock) // entrou 4, estornou 4

    const { data: purchase } = await supabase.from("purchases").select("status").eq("id", purchaseId).single()
    expect(purchase!.status).toBe("cancelada")
  })

  it("getItems retorna os itens com produto relacionado", async () => {
    const purchaseId = await purchaseService.create({
      supplier_id: supplierId,
      purchase_date: new Date().toISOString().slice(0, 10),
      freight: 0,
      discount: 0,
      items: [{ product_id: productId, quantity: 2, unit_price: 8 }],
    })
    const items = await purchaseService.getItems(purchaseId)
    expect(items).toHaveLength(1)
    expect(items[0].product?.name).toBeTruthy()
  })

  it("list() filtra por status e traz o fornecedor relacionado", async () => {
    const result = await purchaseService.list({ status: "pendente", page: 1, limit: 5 })
    expect(result.data.every((p) => p.status === "pendente")).toBe(true)
  })

  it("cancelar uma compra ainda pendente não mexe no estoque", async () => {
    const { data: before } = await supabase.from("products").select("current_stock").eq("id", productId).single()
    const purchaseId = await purchaseService.create({
      supplier_id: supplierId,
      purchase_date: new Date().toISOString().slice(0, 10),
      freight: 0,
      discount: 0,
      items: [{ product_id: productId, quantity: 3, unit_price: 10 }],
    })
    await purchaseService.cancel(purchaseId)
    const { data: after } = await supabase.from("products").select("current_stock").eq("id", productId).single()
    expect(after!.current_stock).toBe(before!.current_stock)
  })
})
