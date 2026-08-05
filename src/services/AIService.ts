import { BaseService } from "./BaseService"
import type {
  AIDashboardSummary,
  AIInsight,
  AISalesForecastSummary,
  AIPurchasingSuggestion,
  AIStockAnalysisSummary,
  AIFinancialAnalysisSummary,
  AIChatConversation,
  AIChatMessage,
} from "@/types"

export class AIService extends BaseService {
  private static instance: AIService

  private constructor() {
    super()
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  /**
   * Retorna o resumo completo do Dashboard de Inteligência Artificial.
   */
  public async getDashboardSummary(): Promise<AIDashboardSummary> {
    const demoCompanyId = "c1111111-1111-1111-1111-111111111111"

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const insights = await this.generateDynamicInsights(demoCompanyId)
      const salesForecast = await this.generateSalesForecast(demoCompanyId)
      const purchasingSuggestions = await this.generatePurchasingSuggestions(demoCompanyId)
      const stockSummary = await this.generateStockAnalysis(demoCompanyId)
      const financialSummary = await this.generateFinancialAnalysis(demoCompanyId)

      return {
        insights,
        sales_forecast: salesForecast,
        purchasing_suggestions: purchasingSuggestions,
        stock_summary: stockSummary,
        financial_summary: financialSummary,
        quick_prompts: [
          "Quanto vendi hoje?",
          "Qual meu lucro este mês?",
          "Quais produtos preciso comprar com urgência?",
          "Quais contas a pagar vencem esta semana?",
          "Quais produtos estão sem giro de estoque?",
        ],
      }
    }

    try {
      const companyId = (await this.getCurrentUserCompanyId()) || demoCompanyId

      const [insights, salesForecast, purchasingSuggestions, stockSummary, financialSummary] = await Promise.all([
        this.getInsights(),
        this.generateSalesForecast(companyId),
        this.generatePurchasingSuggestions(companyId),
        this.generateStockAnalysis(companyId),
        this.generateFinancialAnalysis(companyId),
      ])

      const quickPrompts = [
        "Quanto vendi hoje?",
        "Qual meu lucro este mês?",
        "Quais produtos preciso comprar com urgência?",
        "Quais contas a pagar vencem esta semana?",
        "Quais produtos estão sem giro de estoque?",
      ]

      return {
        insights,
        sales_forecast: salesForecast,
        purchasing_suggestions: purchasingSuggestions,
        stock_summary: stockSummary,
        financial_summary: financialSummary,
        quick_prompts: quickPrompts,
      }
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const insights = await this.generateDynamicInsights(demoCompanyId)
        const salesForecast = await this.generateSalesForecast(demoCompanyId)
        const purchasingSuggestions = await this.generatePurchasingSuggestions(demoCompanyId)
        const stockSummary = await this.generateStockAnalysis(demoCompanyId)
        const financialSummary = await this.generateFinancialAnalysis(demoCompanyId)
        return {
          insights,
          sales_forecast: salesForecast,
          purchasing_suggestions: purchasingSuggestions,
          stock_summary: stockSummary,
          financial_summary: financialSummary,
          quick_prompts: [
            "Quanto vendi hoje?",
            "Qual meu lucro este mês?",
            "Quais produtos preciso comprar com urgência?",
            "Quais contas a pagar vencem esta semana?",
            "Quais produtos estão sem giro de estoque?",
          ],
        }
      }
      this.handleError(error, "ai.getDashboardSummary")
    }
  }

  /**
   * Busca lista de insights pendentes ou em destaque da empresa.
   */
  public async getInsights(): Promise<AIInsight[]> {
    const demoCompanyId = "c1111111-1111-1111-1111-111111111111"

    if (this.isOfflineOrDemoMode()) {
      return this.generateDynamicInsights(demoCompanyId)
    }

    try {
      const companyId = (await this.getCurrentUserCompanyId()) || demoCompanyId

      const { data, error } = await this.supabase
        .from("ai_insights")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error || !data || data.length === 0) {
        return this.generateDynamicInsights(companyId)
      }

      return data as AIInsight[]
    } catch (error) {
      return this.generateDynamicInsights(demoCompanyId)
    }
  }

  /**
   * Atualiza status de um insight (aceitar ou descartar).
   */
  public async updateInsightStatus(id: string, action: "accept" | "dismiss"): Promise<void> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const userId = await this.getCurrentUserId()
      const newStatus = action === "accept" ? "accepted" : "dismissed"

      const { error } = await this.supabase
        .from("ai_insights")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("company_id", companyId)

      if (error && error.code !== "PGRST116") {
        // Ignora erro se for um insight dinâmico sem linha gravada no BD
      }

      // Auditoria
      await this.logAIAction(
        action === "accept" ? "insight_accepted" : "insight_dismissed",
        `Insight ${id} ${newStatus}`,
        { insight_id: id, action }
      )
    } catch (error) {
      this.handleError(error, "ai.updateInsightStatus")
    }
  }

  /**
   * Processa uma consulta em linguagem natural do usuário e retorna a resposta da IA.
   */
  public async processChatQuery(prompt: string, conversationId?: string | null): Promise<{ conversation_id: string; response_message: string; context_data: Record<string, any> }> {
    const demoCompanyId = "c1111111-1111-1111-1111-111111111111"
    const promptLower = prompt.toLowerCase()

    try {
      let companyId = demoCompanyId
      let userId = "00000000-0000-0000-0000-000000000001"

      if (!this.isOfflineOrDemoMode()) {
        try {
          companyId = (await this.getCurrentUserCompanyId()) || demoCompanyId
          userId = (await this.getCurrentUserId()) || userId
        } catch (e) {
          // Ignora falha de autenticação e usa ID de demonstração
        }
      }

      let activeConvId = conversationId

      // Garante que existe uma conversa ativa se o banco estiver online
      if (!this.isOfflineOrDemoMode() && !activeConvId) {
        try {
          const { data: newConv } = await this.supabase
            .from("ai_chat_conversations")
            .insert({
              company_id: companyId,
              user_id: userId,
              title: prompt.length > 30 ? prompt.slice(0, 30) + "..." : prompt,
            })
            .select("id")
            .single()

          if (newConv?.id) {
            activeConvId = newConv.id
          }
        } catch (e) {
          activeConvId = "temp-conv-" + Date.now()
        }
      }

      if (!activeConvId) {
        activeConvId = "temp-conv-" + Date.now()
      }

      // Registra mensagem do usuário no banco se a conversa for persistente
      if (activeConvId && !activeConvId.startsWith("temp-") && !this.isOfflineOrDemoMode()) {
        try {
          await this.supabase.from("ai_chat_messages").insert({
            conversation_id: activeConvId,
            sender: "user",
            message: prompt,
          })
        } catch (e) {}
      }

      // Motor de Resposta Baseado no Contexto Real dos Dados do Sistema
      const contextAnswer = await this.generateAnswerFromSystemData(companyId, promptLower)

      // Tenta enriquecer a resposta com LLM (OpenAI / ChatGPT ou Google Gemini)
      let finalResponseMessage = contextAnswer.message
      try {
        const llmResponse = await this.queryLLM(contextAnswer.message, prompt)
        if (llmResponse) {
          finalResponseMessage = llmResponse
        }
      } catch (e) {
        // Mantém a resposta analítica baseada nos dados do sistema se a API externa falhar
      }

      // Registra resposta da IA no banco
      if (activeConvId && !activeConvId.startsWith("temp-") && !this.isOfflineOrDemoMode()) {
        try {
          await this.supabase.from("ai_chat_messages").insert({
            conversation_id: activeConvId,
            sender: "assistant",
            message: finalResponseMessage,
            context_data: contextAnswer.contextData,
          })
        } catch (e) {}
      }

      const finalConvId = activeConvId || "temp-conv-" + Date.now()

      // Auditoria de consulta IA
      await this.logAIAction("query", prompt, { prompt, conversation_id: finalConvId })

      return {
        conversation_id: finalConvId,
        response_message: finalResponseMessage,
        context_data: contextAnswer.contextData,
      }
    } catch (error) {
      // Fallback supremo para que a IA NUNCA trave a interface e SEMPRE responda ao usuário
      const fallbackAnswer = await this.generateAnswerFromSystemData(demoCompanyId, promptLower)
      return {
        conversation_id: conversationId || "temp-conv-" + Date.now(),
        response_message: fallbackAnswer.message,
        context_data: fallbackAnswer.contextData,
      }
    }
  }

  /**
   * Lista histórico de conversas do usuário.
   */
  public async getConversations(): Promise<AIChatConversation[]> {
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return [
        {
          id: "demo-conv-1",
          company_id: "c1111111-1111-1111-1111-111111111111",
          user_id: "u1",
          title: "Consulta sobre vendas do dia",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    }

    try {
      const companyId = await this.getCurrentUserCompanyId()
      const userId = await this.getCurrentUserId()

      const { data, error } = await this.supabase
        .from("ai_chat_conversations")
        .select("*")
        .eq("company_id", companyId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) return []
      return (data as AIChatConversation[]) || []
    } catch (error) {
      return []
    }
  }

  /**
   * Busca mensagens de uma conversa.
   */
  public async getConversationMessages(conversationId: string): Promise<AIChatMessage[]> {
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return [
        {
          id: "msg-1",
          conversation_id: conversationId || "demo-conv-1",
          sender: "user",
          message: "Quanto vendi hoje?",
          context_data: undefined,
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
        {
          id: "msg-2",
          conversation_id: conversationId || "demo-conv-1",
          sender: "assistant",
          message: `📊 **Resumo de Vendas de Hoje (${new Date().toLocaleDateString("pt-BR")}):**\n- **Faturamento Total:** R$ 1.450,00\n- **Pedidos Finalizados:** 8 pedido(s)\n- **Status:** Operação excelente!`,
          context_data: { totalSalesToday: 1450, totalOrdersToday: 8 },
          created_at: new Date().toISOString(),
        },
      ]
    }

    try {
      const { data, error } = await this.supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) return []
      return (data as AIChatMessage[]) || []
    } catch (error) {
      return []
    }
  }

  // =========================================================================
  // Métodos Internos de Inteligência, Previsão e Agregação
  // =========================================================================

  private async generateSalesForecast(companyId: string): Promise<AISalesForecastSummary> {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const forecastItems = []
      for (let i = -7; i <= 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() + i)
        const dStr = d.toISOString().slice(0, 10)
        const val = 1200 + (Math.abs(i) % 4) * 150
        forecastItems.push({
          date: dStr,
          historical_sales: i <= 0 ? val : 0,
          projected_sales: val,
          confidence_upper: val * 1.15,
          confidence_lower: val * 0.85,
        })
      }
      return {
        daily_forecast: 1450.00,
        weekly_forecast: 10150.00,
        monthly_forecast: 43500.00,
        trend: "upward",
        percentage_change: 8.5,
        forecast_items: forecastItems,
      }
    }

    // Busca vendas dos últimos 30 dias
    const past30Days = new Date(today)
    past30Days.setDate(past30Days.getDate() - 30)

    const { data: sales } = await this.supabase
      .from("sales")
      .select("total, sale_date")
      .eq("company_id", companyId)
      .eq("status", "finalizada")
      .gte("sale_date", past30Days.toISOString().slice(0, 10))

    const salesByDate: Record<string, number> = {}
    let total30Days = 0

    if (sales) {
      sales.forEach((s) => {
        salesByDate[s.sale_date] = (salesByDate[s.sale_date] || 0) + Number(s.total)
        total30Days += Number(s.total)
      })
    }

    const avgDaily = total30Days / 30 || 0
    const dailyForecast = Math.round(avgDaily * 1.05 * 100) / 100
    const weeklyForecast = Math.round(avgDaily * 7 * 1.05 * 100) / 100
    const monthlyForecast = Math.round(avgDaily * 30 * 1.05 * 100) / 100

    const forecastItems = []
    for (let i = -7; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dStr = d.toISOString().slice(0, 10)

      if (i <= 0) {
        forecastItems.push({
          date: dStr,
          historical_sales: salesByDate[dStr] || 0,
          projected_sales: salesByDate[dStr] || avgDaily,
          confidence_upper: (salesByDate[dStr] || avgDaily) * 1.1,
          confidence_lower: (salesByDate[dStr] || avgDaily) * 0.9,
        })
      } else {
        const proj = Math.round(avgDaily * (1 + (i % 3) * 0.02) * 100) / 100
        forecastItems.push({
          date: dStr,
          projected_sales: proj,
          confidence_upper: Math.round(proj * 1.15 * 100) / 100,
          confidence_lower: Math.round(proj * 0.85 * 100) / 100,
        })
      }
    }

    return {
      daily_forecast: dailyForecast,
      weekly_forecast: weeklyForecast,
      monthly_forecast: monthlyForecast,
      trend: avgDaily > 0 ? "upward" : "stable",
      percentage_change: 5.2,
      forecast_items: forecastItems,
    }
  }

  private async generatePurchasingSuggestions(companyId: string): Promise<AIPurchasingSuggestion[]> {
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return [
        {
          product_id: "prod-1",
          product_name: "Vinho Tinto Cabernet Sauvignon 750ml",
          sku: "VIN-CAB-001",
          current_stock: 5,
          min_stock: 15,
          average_daily_sales: 3,
          days_until_stockout: 1,
          recommended_quantity: 30,
          estimated_cost: 1350.00,
          supplier_name: "Vinícola Aurora Ltda",
          urgency: "high",
        },
        {
          product_id: "prod-2",
          product_name: "Cerveja IPA Artesanal 500ml",
          sku: "CER-IPA-002",
          current_stock: 12,
          min_stock: 20,
          average_daily_sales: 4,
          days_until_stockout: 3,
          recommended_quantity: 40,
          estimated_cost: 340.00,
          supplier_name: "Distribuidora Bebidas Brasil",
          urgency: "medium",
        },
      ]
    }

    const { data: products } = await this.supabase
      .from("products")
      .select("id, name, sku, current_stock, minimum_stock, purchase_price, supplier:suppliers(name)")
      .eq("company_id", companyId)
      .eq("active", true)

    if (!products || products.length === 0) return []

    const suggestions: AIPurchasingSuggestion[] = []

    products.forEach((p: any) => {
      const curStock = Number(p.current_stock || 0)
      const minStock = Number(p.minimum_stock || 0)

      if (curStock <= minStock) {
        const avgDaily = Math.max(1, minStock / 5)
        const daysOut = Math.max(0, Math.floor(curStock / avgDaily))
        const recQty = Math.max(10, minStock * 2 - curStock)
        const unitCost = Number(p.purchase_price || 0)

        suggestions.push({
          product_id: p.id,
          product_name: p.name,
          sku: p.sku,
          current_stock: curStock,
          min_stock: minStock,
          average_daily_sales: avgDaily,
          days_until_stockout: daysOut,
          recommended_quantity: recQty,
          estimated_cost: Math.round(recQty * unitCost * 100) / 100,
          supplier_name: p.supplier?.name || "Fornecedor Principal",
          urgency: daysOut <= 2 ? "high" : curStock === 0 ? "high" : "medium",
        })
      }
    })

    return suggestions
  }

  private async generateStockAnalysis(companyId: string): Promise<AIStockAnalysisSummary> {
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return {
        idle_products_count: 3,
        fast_moving_products_count: 18,
        low_stock_products_count: 2,
        expiring_products_count: 1,
        total_stock_value: 48500.00,
        recommendations: [
          "2 produto(s) abaixo do estoque mínimo exigem reposição imediata.",
          "3 produto(s) apresentam estoque elevado em relação ao giro estimado.",
        ],
      }
    }

    let products: any[] | null = null

    try {
      if (!this.isOfflineOrDemoMode()) {
        const { data } = await this.supabase
          .from("products")
          .select("id, current_stock, minimum_stock, purchase_price, expiry_date")
          .eq("company_id", companyId)
          .eq("active", true)

        products = data
      }
    } catch (e) {
      products = null
    }

    if (!products || products.length === 0) {
      const localProducts = this.getLocalMockStore<any>("products", [])
      products = localProducts.filter((p) => p.active !== false)
    }

    if (!products || products.length === 0) {
      return {
        idle_products_count: 0,
        fast_moving_products_count: 0,
        low_stock_products_count: 0,
        expiring_products_count: 0,
        total_stock_value: 0,
        recommendations: ["Adicione produtos para habilitar análises de estoque com IA."],
      }
    }

    let lowStock = 0
    let totalVal = 0
    let idleCount = 0
    let expiringCount = 0

    const today = new Date()
    const thirtyDaysAhead = new Date(today)
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)

    products.forEach((p) => {
      const qty = Number(p.current_stock || 0)
      const price = Number(p.purchase_price || 0)
      totalVal += qty * price

      if (qty <= Number(p.minimum_stock || 0)) lowStock++
      if (qty > 100) idleCount++

      if (p.expiry_date) {
        const exp = new Date(p.expiry_date)
        if (exp <= thirtyDaysAhead) expiringCount++
      }
    })

    const recs: string[] = []
    if (lowStock > 0) recs.push(`${lowStock} produto(s) abaixo do estoque mínimo exigem reposição imediata.`)
    if (idleCount > 0) recs.push(`${idleCount} produto(s) apresentam estoque elevado em relação ao giro estimado.`)
    if (expiringCount > 0) recs.push(`${expiringCount} produto(s) com vencimento nos próximos 30 dias.`)
    if (recs.length === 0) recs.push("Seu estoque está saudável e alinhado com o giro previsto.")

    return {
      idle_products_count: idleCount,
      fast_moving_products_count: Math.max(1, products.length - lowStock - idleCount),
      low_stock_products_count: lowStock,
      expiring_products_count: expiringCount,
      total_stock_value: Math.round(totalVal * 100) / 100,
      recommendations: recs,
    }
  }

  private async generateFinancialAnalysis(companyId: string): Promise<AIFinancialAnalysisSummary> {
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return {
        revenue_this_month: 42500.00,
        expenses_this_month: 18200.00,
        net_profit_this_month: 24300.00,
        margin_percentage: 57.2,
        overdue_receivables: 1200.00,
        overdue_payables: 0,
        cashflow_health: "healthy",
        key_takeaways: [
          "Faturamento acumulado do mês: R$ 42.500,00",
          "Margem de lucro bruta estimada em 57.2%",
          "Nenhuma conta a pagar vencida registrada.",
        ],
      }
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

    let salesData: any[] = []
    let payablesData: any[] = []
    let receivablesData: any[] = []

    try {
      if (!this.isOfflineOrDemoMode()) {
        const [salesRes, payablesRes, receivablesRes] = await Promise.all([
          this.supabase
            .from("sales")
            .select("total")
            .eq("company_id", companyId)
            .eq("status", "finalizada")
            .gte("sale_date", firstDayOfMonth),
          this.supabase
            .from("accounts_payable")
            .select("amount, paid_amount, status, due_date")
            .eq("company_id", companyId),
          this.supabase
            .from("accounts_receivable")
            .select("amount, received_amount, status, due_date")
            .eq("company_id", companyId),
        ])
        salesData = salesRes.data || []
        payablesData = payablesRes.data || []
        receivablesData = receivablesRes.data || []
      }
    } catch (e) {}

    let revenue = 0
    salesData.forEach((s) => (revenue += Number(s.total || 0)))

    let overduePayables = 0
    let totalExpenses = 0
    payablesData.forEach((p) => {
      totalExpenses += Number(p.paid_amount || 0)
      if (p.status !== "Paga" && p.due_date < firstDayOfMonth) {
        overduePayables += Number(p.amount || 0) - Number(p.paid_amount || 0)
      }
    })

    let overdueReceivables = 0
    receivablesData.forEach((r: any) => {
      if (r.status !== "Recebida" && r.due_date < firstDayOfMonth) {
        overdueReceivables += Number(r.amount || 0) - Number(r.received_amount || 0)
      }
    })

    const netProfit = revenue - totalExpenses
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0

    let health: "healthy" | "warning" | "critical" = "healthy"
    if (overduePayables > 5000 || netProfit < 0) health = "warning"
    if (overduePayables > 15000) health = "critical"

    const takeaways: string[] = []
    takeaways.push(`Faturamento acumulado do mês: R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`)
    if (overduePayables > 0) takeaways.push(`Atenção: R$ ${overduePayables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em contas a pagar vencidas.`)
    if (overdueReceivables > 0) takeaways.push(`Inadimplência de clientes: R$ ${overdueReceivables.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} a receber.`)

    return {
      revenue_this_month: Math.round(revenue * 100) / 100,
      expenses_this_month: Math.round(totalExpenses * 100) / 100,
      net_profit_this_month: Math.round(netProfit * 100) / 100,
      margin_percentage: Math.round(margin * 10) / 10,
      overdue_receivables: Math.round(overdueReceivables * 100) / 100,
      overdue_payables: Math.round(overduePayables * 100) / 100,
      cashflow_health: health,
      key_takeaways: takeaways,
    }
  }

  private async generateDynamicInsights(companyId: string): Promise<AIInsight[]> {
    const stock = await this.generateStockAnalysis(companyId)
    const fin = await this.generateFinancialAnalysis(companyId)
    const nowStr = new Date().toISOString()

    const insights: AIInsight[] = []

    if (stock.low_stock_products_count > 0) {
      insights.push({
        id: "dyn-stock-1",
        company_id: companyId,
        type: "alert",
        category: "stock",
        priority: "high",
        title: "Estoque Mínimo Atingido",
        description: `Existem ${stock.low_stock_products_count} produto(s) abaixo da quantidade mínima de segurança.`,
        action_suggestion: "Gerar pedido de compra automático para os itens críticos.",
        status: "pending",
        created_at: nowStr,
        updated_at: nowStr,
      })
    }

    if (fin.overdue_payables > 0) {
      insights.push({
        id: "dyn-fin-1",
        company_id: companyId,
        type: "risk",
        category: "financial",
        priority: "high",
        title: "Contas a Pagar Vencidas",
        description: `Há R$ ${fin.overdue_payables.toLocaleString("pt-BR")} em títulos pendentes que exigem regularização.`,
        action_suggestion: "Acessar o módulo Financeiro e agendar pagamentos prioritários.",
        status: "pending",
        created_at: nowStr,
        updated_at: nowStr,
      })
    }

    insights.push({
      id: "dyn-sales-1",
      company_id: companyId,
      type: "opportunity",
      category: "sales",
      priority: "medium",
      title: "Oportunidade de Promoção de Fim de Semana",
      description: "Produtos da categoria de Bebidas Quentes e Vinhos apresentam maior procura às sextas e sábados.",
      action_suggestion: "Criar um combo promocional no PDV para alavancar a margem média.",
      status: "pending",
      created_at: nowStr,
      updated_at: nowStr,
    })

    return insights
  }

  private async generateAnswerFromSystemData(companyId: string, prompt: string): Promise<{ message: string; contextData: Record<string, any> }> {
    // 1. Vendas / Faturamento / Hoje
    if (prompt.includes("vendi") || prompt.includes("faturamento") || prompt.includes("venda") || prompt.includes("hoje")) {
      const todayStr = new Date().toISOString().slice(0, 10)
      let totalSalesToday = 0
      let totalOrdersToday = 0

      try {
        if (!this.isOfflineOrDemoMode()) {
          const { data: sales } = await this.supabase
            .from("sales")
            .select("total, status, sale_date")
            .eq("company_id", companyId)
            .eq("sale_date", todayStr)

          if (sales && sales.length > 0) {
            sales.forEach((s) => {
              if (s.status === "finalizada") {
                totalSalesToday += Number(s.total || 0)
                totalOrdersToday++
              }
            })
          }
        }
      } catch (e) {
        // Fallback local se a rede Supabase falhar
      }

      if (totalOrdersToday === 0) {
        const localSales = this.getLocalMockStore<any>("sales", [])
        const todaySales = localSales.filter(
          (s) => s.status === "finalizada" && (s.sale_date === todayStr || (s.created_at && s.created_at.startsWith(todayStr)))
        )
        todaySales.forEach((s) => {
          totalSalesToday += Number(s.total || 0)
          totalOrdersToday++
        })
      }

      return {
        message: `📊 **Resumo de Vendas de Hoje (${new Date().toLocaleDateString("pt-BR")}):**\n- **Faturamento Total:** R$ ${totalSalesToday.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n- **Pedidos Finalizados:** ${totalOrdersToday} pedido(s)\n- **Status:** Operação dentro do ritmo esperado.`,
        contextData: { totalSalesToday, totalOrdersToday },
      }
    }

    // 2. Caixa / Saldo
    if (prompt.includes("caixa") || prompt.includes("saldo") || prompt.includes("dinheiro")) {
      try {
        if (!this.isOfflineOrDemoMode()) {
          const { data: cash } = await this.supabase
            .from("cash_registers")
            .select("status, initial_value, opened_at")
            .eq("company_id", companyId)
            .order("opened_at", { ascending: false })
            .limit(1)

          if (cash && cash.length > 0 && cash[0].status === "aberto") {
            const currentCash = cash[0]
            return {
              message: `💰 **Status do Caixa (Aberto):**\n- **Valor Inicial:** R$ ${Number(currentCash.initial_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n- **Aberto em:** ${new Date(currentCash.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}\n- **Operação:** Aberto e pronto para vendas.`,
              contextData: { status: "aberto", initial_value: currentCash.initial_value },
            }
          }
        }
      } catch (e) {}

      // Fallback local do caixa
      const localCash = this.getLocalMockStore<any>("cash_registers", [])
      const openCash = localCash.find((c) => c.status === "aberto")

      if (openCash) {
        return {
          message: `💰 **Status do Caixa (Aberto):**\n- **Valor Inicial:** R$ ${Number(openCash.initial_value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n- **Operação:** Aberto e pronto para vendas.`,
          contextData: { status: "aberto", initial_value: openCash.initial_value },
        }
      }

      return {
        message: "🔒 **Status do Caixa:** O caixa no momento encontra-se **FECHADO**. Para realizar operações de venda no PDV, abra o caixa no menu Caixa.",
        contextData: { status: "fechado" },
      }
    }

    // 3. Estoque / Comprar / Compra / Falta / Reposição / Fim de semana / Preciso
    if (
      prompt.includes("estoque") ||
      prompt.includes("comprar") ||
      prompt.includes("compra") ||
      prompt.includes("preciso") ||
      prompt.includes("falta") ||
      prompt.includes("parado") ||
      prompt.includes("reposição") ||
      prompt.includes("semana")
    ) {
      try {
        const stock = await this.generateStockAnalysis(companyId)
        return {
          message: `📦 **Análise Inteligente de Compras & Estoque:**\n- **Valor Total em Estoque:** R$ ${stock.total_stock_value.toLocaleString("pt-BR")}\n- **Produtos em Estoque Mínimo:** ${stock.low_stock_products_count} item(ns)\n- **Produtos Próximos ao Vencimento:** ${stock.expiring_products_count} item(ns)\n- **Recomendação da IA:** ${stock.recommendations[0] || "Manter monitoramento de giro."}`,
          contextData: { stock },
        }
      } catch (e) {}
    }

    // 4. Lucro / Financeiro / Despesas
    if (prompt.includes("lucro") || prompt.includes("financeiro") || prompt.includes("despesa") || prompt.includes("pagar")) {
      try {
        const fin = await this.generateFinancialAnalysis(companyId)
        return {
          message: `📈 **Visão Geral Financeira do Mês:**\n- **Faturamento Bruto:** R$ ${fin.revenue_this_month.toLocaleString("pt-BR")}\n- **Despesas Pagas:** R$ ${fin.expenses_this_month.toLocaleString("pt-BR")}\n- **Lucro Líquido:** R$ ${fin.net_profit_this_month.toLocaleString("pt-BR")} (Margem: ${fin.margin_percentage}%)\n- **Contas a Pagar Vencidas:** R$ ${fin.overdue_payables.toLocaleString("pt-BR")}\n- **Saúde do Fluxo de Caixa:** ${fin.cashflow_health.toUpperCase()}`,
          contextData: { fin },
        }
      } catch (e) {}
    }

    // Fallback executivo geral seguro
    let fin: AIFinancialAnalysisSummary = {
      revenue_this_month: 0,
      expenses_this_month: 0,
      net_profit_this_month: 0,
      margin_percentage: 0,
      overdue_receivables: 0,
      overdue_payables: 0,
      cashflow_health: "healthy",
      key_takeaways: ["Operação iniciada sem pendências financeiras."],
    }
    let stock: AIStockAnalysisSummary = {
      idle_products_count: 0,
      fast_moving_products_count: 0,
      low_stock_products_count: 0,
      expiring_products_count: 0,
      total_stock_value: 0,
      recommendations: ["Cadastre novos produtos para habilitar a previsão de estoque."],
    }

    try {
      fin = await this.generateFinancialAnalysis(companyId)
      stock = await this.generateStockAnalysis(companyId)
    } catch (e) {}

    return {
      message: `🤖 **Assistente Adega Cloud:**\nEstou analisando seu sistema em tempo real.\n\n- **Faturamento do Mês:** R$ ${fin.revenue_this_month.toLocaleString("pt-BR")}\n- **Lucro Estimado:** R$ ${fin.net_profit_this_month.toLocaleString("pt-BR")}\n- **Alerta de Estoque:** ${stock.low_stock_products_count} produto(s) no estoque mínimo.\n\nVocê pode me perguntar: *"Quanto vendi hoje?"*, *"O que preciso comprar?"*, ou *"Qual o saldo do caixa?"*.`,
      contextData: { fin, stock },
    }
  }

  private async logAIAction(actionType: string, promptSummary: string, details: Record<string, any>): Promise<void> {
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") return

    try {
      const companyId = await this.getCurrentUserCompanyId()
      const userId = await this.getCurrentUserId()

      await this.supabase.from("ai_audit_logs").insert({
        company_id: companyId,
        user_id: userId,
        action_type: actionType,
        prompt_summary: promptSummary,
        details: details,
      })
    } catch (e) {
      // Falha silenciosa de auditoria de IA para não travar a UI
    }
  }

  private async queryLLM(systemContext: string, userPrompt: string): Promise<string | null> {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (openaiApiKey && !openaiApiKey.includes("placeholder")) {
      const openAiResponse = await this.queryOpenAILLM(openaiApiKey, systemContext, userPrompt)
      if (openAiResponse) return openAiResponse
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey && !geminiApiKey.includes("placeholder")) {
      const geminiResponse = await this.queryGeminiLLM(geminiApiKey, systemContext, userPrompt)
      if (geminiResponse) return geminiResponse
    }

    return null
  }

  private async queryOpenAILLM(apiKey: string, systemContext: string, userPrompt: string): Promise<string | null> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Você é o assistente virtual inteligente do sistema Adega Cloud.",
            },
            {
              role: "user",
              content: `Contexto com os dados em tempo real da adega:\n${systemContext}\n\nPergunta do usuário:\n${userPrompt}\n\nResponda em português de forma natural, útil, mantendo a precisão dos dados do contexto.`,
            },
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const fallbackResp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Você é o assistente virtual do Adega Cloud.",
              },
              {
                role: "user",
                content: `Contexto real:\n${systemContext}\nPergunta:\n${userPrompt}`,
              },
            ],
          }),
        })
        if (!fallbackResp.ok) return null
        const fallbackData = await fallbackResp.json()
        return fallbackData.choices?.[0]?.message?.content || null
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    } catch (e) {
      return null
    }
  }

  private async queryGeminiLLM(apiKey: string, systemContext: string, userPrompt: string): Promise<string | null> {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Você é o assistente virtual inteligente do sistema Adega Cloud.\n\nContexto com os dados em tempo real da adega:\n${systemContext}\n\nPergunta do usuário:\n${userPrompt}\n\nResponda em português de forma natural, útil, mantendo a precisão dos dados do contexto.`,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
        const fallbackResp = await fetch(fallbackEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Você é o assistente virtual do Adega Cloud.\nContexto real:\n${systemContext}\nPergunta:\n${userPrompt}`,
                  },
                ],
              },
            ],
          }),
        })

        if (!fallbackResp.ok) return null
        const fallbackData = await fallbackResp.json()
        return fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || null
      }

      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    } catch (e) {
      return null
    }
  }
}

export const aiService = AIService.getInstance()
