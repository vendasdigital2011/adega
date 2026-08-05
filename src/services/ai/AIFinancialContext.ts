import { supabaseAdmin, getSupabaseAdminClient } from "@/lib/supabase-admin"

export interface FinancialContextData {
  revenue_this_month: number
  expenses_this_month: number
  net_profit_this_month: number
  margin_percentage: number
  overdue_receivables: number
  overdue_payables: number
  cashflow_health: "healthy" | "warning" | "critical"
  details_summary: string
}

export class AIFinancialContext {
  public static async getContext(companyId: string): Promise<FinancialContextData> {
    const client = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
      ? supabaseAdmin
      : getSupabaseAdminClient()

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

    const [salesRes, payablesRes, receivablesRes] = await Promise.all([
      client
        .from("sales")
        .select("total")
        .eq("company_id", companyId)
        .eq("status", "finalizada")
        .gte("sale_date", firstDayOfMonth),
      client
        .from("accounts_payable")
        .select("amount, paid_amount, status, due_date")
        .eq("company_id", companyId),
      client
        .from("accounts_receivable")
        .select("amount, received_amount, status, due_date")
        .eq("company_id", companyId),
    ])

    if (salesRes.error) throw new Error(`SUPABASE_QUERY_ERROR: ${salesRes.error.message}`)

    let revenue = 0
    salesRes.data?.forEach((s) => (revenue += Number(s.total || 0)))

    let overduePayables = 0
    let totalExpenses = 0
    payablesRes.data?.forEach((p) => {
      totalExpenses += Number(p.paid_amount || 0)
      if (p.status !== "Paga" && p.due_date < firstDayOfMonth) {
        overduePayables += Number(p.amount || 0) - Number(p.paid_amount || 0)
      }
    })

    let overdueReceivables = 0
    receivablesRes.data?.forEach((r) => {
      if (r.status !== "Recebida" && r.due_date < firstDayOfMonth) {
        overdueReceivables += Number(r.amount || 0) - Number(r.received_amount || 0)
      }
    })

    const netProfit = revenue - totalExpenses
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    let health: "healthy" | "warning" | "critical" = "healthy"
    if (overduePayables > 5000 || netProfit < 0) health = "warning"
    if (overduePayables > 15000) health = "critical"

    return {
      revenue_this_month: Math.round(revenue * 100) / 100,
      expenses_this_month: Math.round(totalExpenses * 100) / 100,
      net_profit_this_month: Math.round(netProfit * 100) / 100,
      margin_percentage: Math.round(margin * 10) / 10,
      overdue_receivables: Math.round(overdueReceivables * 100) / 100,
      overdue_payables: Math.round(overduePayables * 100) / 100,
      cashflow_health: health,
      details_summary: `Faturamento Mês: R$ ${revenue.toLocaleString("pt-BR")}, Despesas: R$ ${totalExpenses.toLocaleString("pt-BR")}, Lucro Líquido: R$ ${netProfit.toLocaleString("pt-BR")}, Contas a Pagar Vencidas: R$ ${overduePayables.toLocaleString("pt-BR")}.`,
    }
  }
}
