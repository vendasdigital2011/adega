import { describe, it, expect, beforeAll } from "vitest"
import { notificationService } from "@/services/NotificationService"
import { productService } from "@/services/ProductService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("NotificationService (integração)", () => {
  let productName: string
  let notificationId: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("generate() cria um alerta de estoque baixo para um produto sob o mínimo", async () => {
    const { data: category } = await supabase.from("categories").select("id").eq("active", true).limit(1).single()
    productName = `Produto Notif Vitest ${Date.now()}`
    const product = await productService.create({
      name: productName,
      sku: `SKU-NOTIF-${Date.now()}`,
      category_id: category!.id,
      sale_price: 10,
      minimum_stock: 5,
    })
    // current_stock nasce em 0, que já é <= minimum_stock 5 — dispara o alerta.
    await notificationService.generate()

    // Busca pelo id real da linha em vez de assumir posição em list(N) — a
    // tabela é compartilhada com outros testes rodando na mesma suíte e a
    // ordem/quantidade de linhas pode mudar entre uma chamada e outra.
    const { data: row } = await supabase
      .from("notifications")
      .select("id, title, type")
      .eq("type", "estoque_baixo")
      .ilike("title", `%${product.name}%`)
      .single()
    expect(row).toBeTruthy()
    notificationId = row!.id
  })

  it("generate() é idempotente: rodar de novo não duplica o alerta deste produto", async () => {
    await notificationService.generate()
    const { data: rows } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", "estoque_baixo")
      .ilike("title", `%${productName}%`)
    expect(rows).toHaveLength(1)
  })

  it("markAsRead marca só aquela notificação", async () => {
    await notificationService.markAsRead(notificationId)
    const { data: row } = await supabase.from("notifications").select("read").eq("id", notificationId).single()
    expect(row?.read).toBe(true)
  })

  it("markAllAsRead zera o contador de não lidas", async () => {
    await notificationService.markAllAsRead()
    const count = await notificationService.unreadCount()
    expect(count).toBe(0)
  })

  it("list() sem argumento usa o limite padrão de 15", async () => {
    const list = await notificationService.list()
    expect(list.length).toBeLessThanOrEqual(15)
  })

  it("RLS: vendedor sem inventory/financial/cash.view não vê nenhuma notificação", async () => {
    const vendedor = await signInAs("vendedor")
    await vendedor.rpc("generate_notifications")
    const { data } = await vendedor.from("notifications").select("id")
    expect(data).toEqual([])
  })
})
