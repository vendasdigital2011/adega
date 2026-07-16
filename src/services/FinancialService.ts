import { BaseService } from "./BaseService"

export type CashFlowEntryType = "Venda" | "Recebimento" | "Pagamento" | "Sangria" | "Suprimento"
export type CashFlowDirection = "Entrada" | "Saída"

export interface CashFlowEntry {
  id: string
  type: CashFlowEntryType
  direction: CashFlowDirection
  value: number
  description: string | null
  date: string
}

export class FinancialService extends BaseService {
  private static instance: FinancialService

  private constructor() {
    super()
  }

  public static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService()
    }
    return FinancialService.instance
  }

  // Fluxo de caixa: leitura combinada de recebimentos, pagamentos e
  // movimentos de caixa (venda à vista, sangria, suprimento) no período.
  public async getCashFlow(startDate: string, endDate: string): Promise<CashFlowEntry[]> {
    try {
      const [receiptsRes, paymentsRes, movementsRes] = await Promise.all([
        this.supabase
          .from("receivable_receipts")
          .select("id, value, description, received_at")
          .gte("received_at", startDate)
          .lte("received_at", `${endDate}T23:59:59`),
        this.supabase
          .from("payable_payments")
          .select("id, value, description, paid_at")
          .gte("paid_at", startDate)
          .lte("paid_at", `${endDate}T23:59:59`),
        this.supabase
          .from("cash_movements")
          .select("id, movement_type, value, description, created_at")
          .gte("created_at", startDate)
          .lte("created_at", `${endDate}T23:59:59`),
      ])

      for (const res of [receiptsRes, paymentsRes, movementsRes]) {
        if (res.error) throw res.error
      }

      const entries: CashFlowEntry[] = []

      for (const r of receiptsRes.data || []) {
        entries.push({
          id: `receipt-${r.id}`,
          type: "Recebimento",
          direction: "Entrada",
          value: Number(r.value),
          description: r.description,
          date: r.received_at,
        })
      }

      for (const p of paymentsRes.data || []) {
        entries.push({
          id: `payment-${p.id}`,
          type: "Pagamento",
          direction: "Saída",
          value: Number(p.value),
          description: p.description,
          date: p.paid_at,
        })
      }

      for (const m of movementsRes.data || []) {
        if (m.movement_type === "Entrada") {
          entries.push({
            id: `movement-${m.id}`,
            type: "Venda",
            direction: "Entrada",
            value: Number(m.value),
            description: m.description,
            date: m.created_at,
          })
        } else if (m.movement_type === "Sangria" || m.movement_type === "Suprimento") {
          entries.push({
            id: `movement-${m.id}`,
            type: m.movement_type,
            direction: m.movement_type === "Suprimento" ? "Entrada" : "Saída",
            value: Number(m.value),
            description: m.description,
            date: m.created_at,
          })
        }
        // 'Saída' pura de cash_movements é sempre estorno de venda cancelada
        // (dinheiro devolvido) — não entra como saída de fluxo de caixa
        // financeiro, pois a "Venda" que a originou também não fica no fluxo.
      }

      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return entries
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const financialService = FinancialService.getInstance()
