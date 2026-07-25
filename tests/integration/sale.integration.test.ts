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
        items: [{ product_id: productId, quantity: 1 }],
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
      items: [{ product_id: productId, quantity: 3 }],
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
        items: [{ product_id: productId, quantity: 99999 }],
      })
    ).rejects.toBeTruthy()
  })

  it("venda Fiado exige cliente e gera conta a receber, sem exigir caixa aberto", async () => {
    const saleId = await saleService.create({
      customer_id: customerId,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "Fiado",
      items: [{ product_id: productId, quantity: 1 }],
    })
    const { data: receivable } = await supabase
      .from("accounts_receivable")
      .select("id, amount, status")
      .eq("sale_id", saleId)
      .single()
    expect(receivable?.amount).toBe(25)
    expect(receivable?.status).toBe("Aberta")
  })

  // Auditoria "reviravolta", achado P6 (migration 0023): cliente sem limite
  // de crédito (customerId, criado sem credit_limit) já prova "sem limite"
  // no teste acima. Aqui prova o caminho oposto: com limite definido, o
  // saldo em aberto (contas a receber Aberta/Parcial) + a nova venda não
  // pode ultrapassar.
  it("venda Fiado respeita o limite de crédito do cliente (soma o saldo em aberto)", async () => {
    const limitedCustomer = await customerService.create({
      name: `Cliente Limite Crédito Vitest ${Date.now()}`,
      credit_limit: 30,
    })

    // primeira venda de 25 cabe no limite de 30
    await saleService.create({
      customer_id: limitedCustomer.id,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "Fiado",
      items: [{ product_id: productId, quantity: 1 }],
    })

    // segunda venda de 25 faria o saldo em aberto ir a 50, estourando os 30
    await expect(
      saleService.create({
        customer_id: limitedCustomer.id,
        sale_date: new Date().toISOString().slice(0, 10),
        discount: 0,
        payment_method: "Fiado",
        items: [{ product_id: productId, quantity: 1 }],
      })
    ).rejects.toBeTruthy()
  })

  it("cancelar uma venda estorna o estoque", async () => {
    const { data: before } = await supabase.from("products").select("current_stock").eq("id", productId).single()

    const saleId = await saleService.create({
      customer_id: null,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 0,
      payment_method: "PIX",
      items: [{ product_id: productId, quantity: 2 }],
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
      items: [{ product_id: productId, quantity: 1 }],
    })
    const items = await saleService.getItems(saleId)
    expect(items).toHaveLength(1)
    expect(items[0].product?.name).toBeTruthy()
  })

  it("list() filtra por status e traz o cliente relacionado", async () => {
    const result = await saleService.list({ status: "finalizada", page: 1, limit: 5 })
    expect(result.data.every((s) => s.status === "finalizada")).toBe(true)
  })

  // Regressão da auditoria "reviravolta" (2026-07-21, migration 0021): create_sale
  // confiava no unit_price enviado pelo chamador — qualquer usuário com sales.create
  // podia manipular o preço via chamada direta da RPC (fora da UI/SaleService, que
  // desde esta migration nem envia mais esse campo). O preço agora é sempre
  // resolvido no servidor a partir de products.sale_price/promotion_price.
  it("preço do item é sempre resolvido no servidor, mesmo com unit_price manipulado no payload", async () => {
    const { data: saleId, error } = await supabase.rpc("create_sale", {
      p_customer_id: null,
      p_sale_date: new Date().toISOString().slice(0, 10),
      p_discount: 0,
      p_payment_method: "PIX",
      // payload manipulado: tenta forçar o preço pra 0,01 (produto de teste custa 25)
      p_items: [{ product_id: productId, quantity: 1, unit_price: 0.01 }],
    })
    expect(error).toBeNull()

    const { data: sale } = await supabase.from("sales").select("total").eq("id", saleId).single()
    expect(sale?.total).toBe(25) // preço real do catálogo — o 0,01 manipulado foi ignorado

    const { data: item } = await supabase.from("sale_items").select("unit_price").eq("sale_id", saleId).single()
    expect(item?.unit_price).toBe(25)
  })

  // O papel Vendedor (roles.discount_limit_percent = 10, definido nesta mesma
  // migration) hoje não tem sales.create/cash.manage concedidos no ambiente de
  // teste (decisão de matriz de permissão fora do escopo desta correção) — não
  // dá pra exercitar o caminho completo "vendedor tentando estourar o limite"
  // sem alterar grants de produção. O que É verificável sem tocar em grants:
  // (a) o dado do limite foi gravado corretamente, e (b) um perfil sem limite
  // (Administrador, discount_limit_percent = NULL) continua sem teto adicional
  // e o guard de total >= 0 segue funcionando.
  it("Vendedor recebe limite de desconto de 10% nesta migration", async () => {
    const { data: role } = await supabase.from("roles").select("discount_limit_percent").eq("name", "Vendedor").single()
    expect(Number(role?.discount_limit_percent)).toBe(10)
  })

  it("perfil sem limite (Administrador) pode aplicar desconto alto, mas nunca deixa o total negativo", async () => {
    const saleId = await saleService.create({
      customer_id: null,
      sale_date: new Date().toISOString().slice(0, 10),
      discount: 20, // 80% de desconto sobre um item de 25 — Administrador não tem teto
      payment_method: "PIX",
      items: [{ product_id: productId, quantity: 1 }],
    })
    const { data: sale } = await supabase.from("sales").select("total").eq("id", saleId).single()
    expect(sale?.total).toBe(5)

    await expect(
      saleService.create({
        customer_id: null,
        sale_date: new Date().toISOString().slice(0, 10),
        discount: 999, // maior que o subtotal (25) — sempre bloqueado, mesmo sem limite de perfil
        payment_method: "PIX",
        items: [{ product_id: productId, quantity: 1 }],
      })
    ).rejects.toBeTruthy()
  })
})
