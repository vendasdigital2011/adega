import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface AlertItem {
  severity: "critical" | "warning" | "info"
  category: "estoque" | "financeiro" | "vendas" | "caixa"
  title: string
  description: string
  action_suggested: string
}

export interface AlertsContextData {
  critical_alerts: AlertItem[]
  warning_alerts: AlertItem[]
  info_alerts: AlertItem[]
  summary_text: string
}

export class AIAlertsContext {
  public static async getContext(companyId: string): Promise<AlertsContextData> {
    const alerts: AlertItem[] = []

    try {
      const supabase = await createServerSupabaseClient()
      const today = new Date().toISOString().split("T")[0]

      // 1. Alertas de Estoque Zerado / Crítico
      const { data: outOfStock } = await supabase
        .from("products")
        .select("id, name, current_stock, minimum_stock")
        .eq("company_id", companyId)
        .eq("active", true)
        .eq("current_stock", 0)

      if (outOfStock && outOfStock.length > 0) {
        alerts.push({
          severity: "critical",
          category: "estoque",
          title: `${outOfStock.length} produto(s) com estoque ZERADO`,
          description: `Produtos sem estoque: ${outOfStock.map((p) => p.name).slice(0, 3).join(", ")}${outOfStock.length > 3 ? "..." : ""}`,
          action_suggested: "Realizar pedido de compra urgente para repor estoque zerado.",
        })
      }

      const { data: lowStock } = await supabase
        .from("products")
        .select("id, name, current_stock, minimum_stock")
        .eq("company_id", companyId)
        .eq("active", true)
        .gt("current_stock", 0)

      const belowMin = (lowStock || []).filter((p) => p.current_stock <= (p.minimum_stock || 5))

      if (belowMin.length > 0) {
        alerts.push({
          severity: "warning",
          category: "estoque",
          title: `${belowMin.length} produto(s) abaixo do estoque mínimo`,
          description: `Itens em nível crítico: ${belowMin.map((p) => p.name).slice(0, 3).join(", ")}`,
          action_suggested: "Programar reposição de estoque com fornecedores.",
        })
      }

      // 2. Alertas Financeiros (Contas a Pagar Vencidas)
      const { data: overduePayables } = await supabase
        .from("financial_entry")
        .select("id, description, amount, due_date")
        .eq("company_id", companyId)
        .eq("type", "despesa")
        .eq("status", "pendente")
        .lt("due_date", today)

      if (overduePayables && overduePayables.length > 0) {
        const totalOverdue = overduePayables.reduce((acc, c) => acc + Number(c.amount || 0), 0)
        alerts.push({
          severity: "critical",
          category: "financeiro",
          title: `${overduePayables.length} conta(s) a pagar VENCIDA(S)`,
          description: `Total pendente vencido: R$ ${totalOverdue.toFixed(2)}`,
          action_suggested: "Realizar o pagamento imediatamente para evitar multas e juros.",
        })
      }

      // 3. Alertas de Caixa
      const { data: openCash } = await supabase
        .from("cash_movements")
        .select("id, status, opened_at, initial_balance")
        .eq("company_id", companyId)
        .eq("status", "aberto")
        .order("opened_at", { ascending: false })
        .limit(1)

      if (!openCash || openCash.length === 0) {
        alerts.push({
          severity: "warning",
          category: "caixa",
          title: "Caixa atualmente FECHADO",
          description: "Nenhum turno de caixa aberto na adega neste momento.",
          action_suggested: "Abrir o turno do caixa no PDV antes de realizar vendas em dinheiro.",
        })
      } else {
        alerts.push({
          severity: "info",
          category: "caixa",
          title: "Turno de caixa aberto",
          description: `Caixa aberto em ${new Date(openCash[0].opened_at).toLocaleTimeString("pt-BR")} com saldo inicial de R$ ${Number(openCash[0].initial_balance).toFixed(2)}`,
          action_suggested: "Conferir sangrias e entradas ao final do expediente.",
        })
      }

      const critical = alerts.filter((a) => a.severity === "critical")
      const warning = alerts.filter((a) => a.severity === "warning")
      const info = alerts.filter((a) => a.severity === "info")

      const summaryText = `Alertas Críticos: ${critical.length}, Alertas de Atenção: ${warning.length}, Informativos: ${info.length}.`

      return {
        critical_alerts: critical,
        warning_alerts: warning,
        info_alerts: info,
        summary_text: summaryText,
      }
    } catch (e) {
      return {
        critical_alerts: [],
        warning_alerts: [],
        info_alerts: [],
        summary_text: "Informações de alertas indisponíveis no momento.",
      }
    }
  }
}
