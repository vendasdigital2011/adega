import { AIFinancialContext, FinancialContextData } from "./AIFinancialContext"
import { AIInventoryContext, InventoryContextData } from "./AIInventoryContext"
import { AISalesContext, SalesContextData } from "./AISalesContext"
import { AIPurchasesContext, PurchasesContextData } from "./AIPurchasesContext"
import { AICashContext, CashContextData } from "./AICashContext"
import { AIProductsContext, ProductsContextData } from "./AIProductsContext"
import { AIAlertsContext, AlertsContextData } from "./AIAlertsContext"

export type PeriodType = "today" | "7_days" | "30_days" | "this_month" | "last_month" | "90_days" | "custom"
export type AnalysisType =
  | "overview"
  | "sales"
  | "profit"
  | "inventory"
  | "turnover"
  | "purchasing"
  | "cash"
  | "alerts"
  | "free_chat"

export interface AIContextPayload {
  prompt: string
  analysisType: AnalysisType
  period: PeriodType
  companyId: string
  userId: string
  periodLabel: string
  financial?: FinancialContextData
  inventory?: InventoryContextData
  sales?: SalesContextData
  purchases?: PurchasesContextData
  cash?: CashContextData
  products?: ProductsContextData
  alerts?: AlertsContextData
  formattedContextText: string
}

export class AIContextService {
  /**
   * Calcula as datas de início e fim para o período selecionado e período equivalente anterior
   */
  public static calculateDates(period: PeriodType, customStart?: string, customEnd?: string) {
    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()
    let prevStartDate = new Date()
    let prevEndDate = new Date()

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      prevStartDate.setDate(prevStartDate.getDate() - 1)
      prevStartDate.setHours(0, 0, 0, 0)
      prevEndDate.setDate(prevEndDate.getDate() - 1)
      prevEndDate.setHours(23, 59, 59, 999)
    } else if (period === "7_days") {
      startDate.setDate(now.getDate() - 7)
      prevStartDate.setDate(now.getDate() - 14)
      prevEndDate.setDate(now.getDate() - 7)
    } else if (period === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (period === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      prevEndDate = new Date(now.getFullYear(), now.getMonth() - 1, 0)
    } else if (period === "90_days") {
      startDate.setDate(now.getDate() - 90)
      prevStartDate.setDate(now.getDate() - 180)
      prevEndDate.setDate(now.getDate() - 90)
    } else if (period === "custom" && customStart && customEnd) {
      startDate = new Date(customStart)
      endDate = new Date(customEnd)
      const diffMs = endDate.getTime() - startDate.getTime()
      prevEndDate = new Date(startDate.getTime() - 1)
      prevStartDate = new Date(prevEndDate.getTime() - diffMs)
    } else {
      // Padrão: 30 dias
      startDate.setDate(now.getDate() - 30)
      prevStartDate.setDate(now.getDate() - 60)
      prevEndDate.setDate(now.getDate() - 30)
    }

    return {
      current: { start: startDate.toISOString(), end: endDate.toISOString() },
      previous: { start: prevStartDate.toISOString(), end: prevEndDate.toISOString() },
    }
  }

  public static async assembleContext(
    companyId: string,
    userId: string,
    prompt: string,
    analysisType: AnalysisType = "free_chat",
    period: PeriodType = "30_days",
    customStart?: string,
    customEnd?: string
  ): Promise<AIContextPayload> {
    const dates = this.calculateDates(period, customStart, customEnd)

    let financial: FinancialContextData | undefined
    let inventory: InventoryContextData | undefined
    let sales: SalesContextData | undefined
    let purchases: PurchasesContextData | undefined
    let cash: CashContextData | undefined
    let products: ProductsContextData | undefined
    let alerts: AlertsContextData | undefined

    const contextParts: string[] = []

    const p = prompt.toLowerCase()
    const isGeneral = analysisType === "overview" || analysisType === "free_chat"

    // 1. Carrega dados de Vendas (sempre inclusos no Overview ou se solicitado)
    if (isGeneral || analysisType === "sales" || analysisType === "profit" || p.includes("venda") || p.includes("faturamento")) {
      sales = await AISalesContext.getContext(companyId)
      contextParts.push(`[DADOS DE VENDAS REAIS (Período: ${period})]: ${sales.details_summary}`)
    }

    // 2. Carrega dados do Caixa
    if (isGeneral || analysisType === "cash" || p.includes("caixa") || p.includes("saldo")) {
      cash = await AICashContext.getContext(companyId)
      contextParts.push(`[DADOS DO CAIXA REAL]: ${cash.details_summary}`)
    }

    // 3. Carrega dados do Estoque
    if (isGeneral || analysisType === "inventory" || analysisType === "purchasing" || p.includes("estoque") || p.includes("compra")) {
      inventory = await AIInventoryContext.getContext(companyId)
      contextParts.push(`[DADOS DO ESTOQUE REAL]: ${inventory.details_summary}`)
      if (inventory.low_stock_items.length > 0) {
        const itemsList = inventory.low_stock_items.map((it) => `${it.name} (Atual: ${it.current_stock}, Mín: ${it.minimum_stock})`).join("; ")
        contextParts.push(`[PRODUTOS EM ESTOQUE MÍNIMO]: ${itemsList}`)
      }
    }

    // 4. Carrega dados Financeiros
    if (isGeneral || analysisType === "profit" || p.includes("lucro") || p.includes("despesa") || p.includes("pagar")) {
      financial = await AIFinancialContext.getContext(companyId)
      contextParts.push(`[DADOS FINANCEIROS REAIS]: ${financial.details_summary}`)
    }

    // 5. Carrega dados de Giro de Produtos
    if (isGeneral || analysisType === "turnover" || p.includes("giro") || p.includes("parado") || p.includes("mais vendido")) {
      products = await AIProductsContext.getContext(companyId, dates.current.start, dates.current.end)
      contextParts.push(`[RANKING E GIRO DE PRODUTOS]: ${products.summary_text}`)
    }

    // 6. Carrega Matriz de Alertas
    if (isGeneral || analysisType === "alerts" || p.includes("atenção") || p.includes("alerta") || p.includes("problema")) {
      alerts = await AIAlertsContext.getContext(companyId)
      contextParts.push(`[ALERTAS DA OPERAÇÃO]: ${alerts.summary_text}`)
    }

    // 7. Carrega Compras e Fornecedores
    if (analysisType === "purchasing" || p.includes("fornecedor")) {
      purchases = await AIPurchasesContext.getContext(companyId)
      contextParts.push(`[DADOS DE COMPRAS/FORNECEDORES]: ${purchases.details_summary}`)
    }

    const periodLabels: Record<PeriodType, string> = {
      today: "Hoje",
      "7_days": "Últimos 7 dias",
      "30_days": "Últimos 30 dias",
      this_month: "Este mês",
      last_month: "Mês anterior",
      "90_days": "Últimos 90 dias",
      custom: "Período personalizado",
    }

    return {
      prompt,
      analysisType,
      period,
      companyId,
      userId,
      periodLabel: periodLabels[period] || "Últimos 30 dias",
      financial,
      inventory,
      sales,
      purchases,
      cash,
      products,
      alerts,
      formattedContextText: contextParts.join("\n\n"),
    }
  }
}
