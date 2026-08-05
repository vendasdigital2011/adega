import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export interface SalesContextData {
  today_sales_total: number
  today_orders_count: number
  month_sales_total: number
  month_orders_count: number
  average_ticket: number
  details_summary: string
}

export class AISalesContext {
  public static async getContext(companyId: string): Promise<SalesContextData> {
    try {
      const client = getSupabaseAdminClient()

      const todayStr = new Date().toISOString().slice(0, 10)
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      const [todayRes, monthRes] = await Promise.all([
        client
          .from("sales")
          .select("total, status")
          .eq("company_id", companyId)
          .eq("sale_date", todayStr),
        client
          .from("sales")
          .select("total, status")
          .eq("company_id", companyId)
          .gte("sale_date", firstDayOfMonth),
      ])

      let todaySales = 0
      let todayOrders = 0
      todayRes.data?.forEach((s) => {
        if (s.status === "finalizada") {
          todaySales += Number(s.total || 0)
          todayOrders++
        }
      })

      let monthSales = 0
      let monthOrders = 0
      monthRes.data?.forEach((s) => {
        if (s.status === "finalizada") {
          monthSales += Number(s.total || 0)
          monthOrders++
        }
      })

      const avgTicket = monthOrders > 0 ? monthSales / monthOrders : 0

      return {
        today_sales_total: Math.round(todaySales * 100) / 100,
        today_orders_count: todayOrders,
        month_sales_total: Math.round(monthSales * 100) / 100,
        month_orders_count: monthOrders,
        average_ticket: Math.round(avgTicket * 100) / 100,
        details_summary: `Vendas Hoje (${new Date().toLocaleDateString("pt-BR")}): R$ ${todaySales.toLocaleString("pt-BR")} em ${todayOrders} pedido(s). Vendas Mês: R$ ${monthSales.toLocaleString("pt-BR")} em ${monthOrders} pedido(s). Ticket Médio: R$ ${avgTicket.toLocaleString("pt-BR")}.`,
      }
    } catch (e) {
      return {
        today_sales_total: 0,
        today_orders_count: 0,
        month_sales_total: 0,
        month_orders_count: 0,
        average_ticket: 0,
        details_summary: "Sem registro de vendas para o período selecionado.",
      }
    }
  }
}
