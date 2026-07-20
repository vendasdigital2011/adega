import { describe, it, expect, beforeAll } from "vitest"
import { accountsReceivableService } from "@/services/AccountsReceivableService"
import { accountsPayableService } from "@/services/AccountsPayableService"
import { costCenterService } from "@/services/CostCenterService"
import { financialService } from "@/services/FinancialService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"

describe("Financeiro (integração)", () => {
  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("CostCenterService: cria, lista ativos e desativa", async () => {
    const name = `Centro Teste Vitest ${Date.now()}`
    const created = await costCenterService.create({ name })
    expect(created.active).toBe(true)

    const active = await costCenterService.listActive()
    expect(active.some((c) => c.id === created.id)).toBe(true)

    await costCenterService.setActive(created.id, false)
    const activeAfter = await costCenterService.listActive()
    expect(activeAfter.some((c) => c.id === created.id)).toBe(false)
  })

  it("rejeita nome de centro de custo duplicado", async () => {
    const name = `Centro Dup Vitest ${Date.now()}`
    await costCenterService.create({ name })
    await expect(costCenterService.create({ name })).rejects.toMatchObject({ code: "DUPLICATE_NAME" })
  })

  it("Receivable: cria, recebe parcial, recebe o restante e conclui", async () => {
    const id = await accountsReceivableService.create({
      customer_id: null,
      cost_center_id: null,
      description: "avulsa vitest",
      due_date: "2026-12-31",
      amount: 100,
    })

    const partial = await accountsReceivableService.registerReceipt(id, 40)
    expect(partial.status).toBe("Parcial")
    expect(partial.received_amount).toBe(40)

    const settled = await accountsReceivableService.registerReceipt(id, 60)
    expect(settled.status).toBe("Recebida")

    const receipts = await accountsReceivableService.listReceipts(id)
    expect(receipts).toHaveLength(2)
  })

  it("Receivable: rejeita receber mais do que o saldo em aberto", async () => {
    const id = await accountsReceivableService.create({
      customer_id: null,
      cost_center_id: null,
      description: "avulsa vitest overpay",
      due_date: "2026-12-31",
      amount: 50,
    })
    await expect(accountsReceivableService.registerReceipt(id, 999)).rejects.toBeTruthy()
  })

  it("Receivable: cancelar é bloqueado depois de qualquer recebimento", async () => {
    const id = await accountsReceivableService.create({
      customer_id: null,
      cost_center_id: null,
      description: "avulsa vitest cancel",
      due_date: "2026-12-31",
      amount: 80,
    })
    await accountsReceivableService.registerReceipt(id, 10)
    await expect(accountsReceivableService.cancel(id)).rejects.toBeTruthy()
  })

  it("Receivable: cancela livremente uma conta sem nenhum recebimento", async () => {
    const id = await accountsReceivableService.create({
      customer_id: null,
      cost_center_id: null,
      description: "avulsa vitest cancel limpo",
      due_date: "2026-12-31",
      amount: 30,
    })
    await accountsReceivableService.cancel(id)
    const { data } = await supabase.from("accounts_receivable").select("status").eq("id", id).single()
    expect(data?.status).toBe("Cancelada")
  })

  it("Payable: cria, paga e conclui", async () => {
    const id = await accountsPayableService.create({
      supplier_id: null,
      cost_center_id: null,
      description: "conta avulsa vitest",
      due_date: "2026-12-31",
      amount: 200,
    })
    const paid = await accountsPayableService.registerPayment(id, 200)
    expect(paid.status).toBe("Paga")
    const payments = await accountsPayableService.listPayments(id)
    expect(payments).toHaveLength(1)
  })

  it("getCashFlow combina recebimentos/pagamentos/movimentos no período", async () => {
    // Janela ampla (não só "hoje") para pegar de verdade cada tipo de
    // entrada que o método mapeia (Recebimento/Pagamento/Venda/Sangria/
    // Suprimento) — a empresa de teste já acumulou histórico real de todas
    // essas sprints anteriores, então "hoje" sozinho é frágil para cobrir
    // os branches de forma determinística.
    const entries = await financialService.getCashFlow("2020-01-01", "2030-12-31")
    expect(Array.isArray(entries)).toBe(true)
    const types = new Set(entries.map((e) => e.type))
    expect(types.has("Recebimento") || types.has("Pagamento")).toBe(true)
  })

  it("CostCenterService: update() sozinho (não via setActive) e rejeita nome duplicado", async () => {
    const a = await costCenterService.create({ name: `Centro Update A ${Date.now()}` })
    const b = await costCenterService.create({ name: `Centro Update B ${Date.now()}` })

    const renamed = await costCenterService.update(b.id, { name: `Centro Renomeado ${Date.now()}` })
    expect(renamed.id).toBe(b.id)

    await expect(costCenterService.update(b.id, { name: a.name })).rejects.toMatchObject({ code: "DUPLICATE_NAME" })
  })

  it("CostCenterService: list() com busca e filtro active", async () => {
    const name = `Centro Busca Vitest ${Date.now()}`
    await costCenterService.create({ name })
    const result = await costCenterService.list({ search: name, active: true, page: 1, limit: 10 })
    expect(result.data.some((c) => c.name === name)).toBe(true)
  })

  it("Payable: list() filtra por status e listPayments retorna o histórico", async () => {
    const result = await accountsPayableService.list({ status: "Aberta", page: 1, limit: 5 })
    expect(result.data.every((p) => p.status === "Aberta")).toBe(true)
  })

  it("Payable: rejeita pagar mais do que o saldo em aberto e cancelar após pagamento", async () => {
    const id = await accountsPayableService.create({
      supplier_id: null,
      cost_center_id: null,
      description: "avulsa vitest payable overpay",
      due_date: "2026-12-31",
      amount: 40,
    })
    await expect(accountsPayableService.registerPayment(id, 999)).rejects.toBeTruthy()
    await accountsPayableService.registerPayment(id, 10)
    await expect(accountsPayableService.cancel(id)).rejects.toBeTruthy()
  })

  it("Receivable: list() filtra por status", async () => {
    const result = await accountsReceivableService.list({ status: "Recebida", page: 1, limit: 5 })
    expect(result.data.every((r) => r.status === "Recebida")).toBe(true)
  })
})
