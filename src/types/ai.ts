export type AIInsightType = "alert" | "recommendation" | "opportunity" | "risk"
export type AIInsightCategory = "stock" | "purchases" | "sales" | "financial" | "customers"
export type AIInsightPriority = "high" | "medium" | "low"
export type AIInsightStatus = "pending" | "accepted" | "dismissed"

export interface AIInsight {
  id: string
  company_id: string
  type: AIInsightType
  category: AIInsightCategory
  priority: AIInsightPriority
  title: string
  description: string
  action_suggestion?: string | null
  metadata?: Record<string, any>
  status: AIInsightStatus
  created_at: string
  updated_at: string
}

export interface AIChatConversation {
  id: string
  company_id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface AIChatMessage {
  id: string
  conversation_id: string
  sender: "user" | "assistant"
  message: string
  context_data?: Record<string, any>
  created_at: string
}

export interface AISalesForecastItem {
  date: string
  historical_sales?: number
  projected_sales: number
  confidence_upper: number
  confidence_lower: number
}

export interface AISalesForecastSummary {
  daily_forecast: number
  weekly_forecast: number
  monthly_forecast: number
  trend: "upward" | "downward" | "stable"
  percentage_change: number
  forecast_items: AISalesForecastItem[]
}

export interface AIPurchasingSuggestion {
  product_id: string
  product_name: string
  sku: string
  current_stock: number
  min_stock: number
  average_daily_sales: number
  days_until_stockout: number
  recommended_quantity: number
  estimated_cost: number
  supplier_name?: string | null
  urgency: "high" | "medium" | "low"
}

export interface AIStockAnalysisSummary {
  idle_products_count: number
  fast_moving_products_count: number
  low_stock_products_count: number
  expiring_products_count: number
  total_stock_value: number
  recommendations: string[]
}

export interface AIFinancialAnalysisSummary {
  revenue_this_month: number
  expenses_this_month: number
  net_profit_this_month: number
  margin_percentage: number
  overdue_receivables: number
  overdue_payables: number
  cashflow_health: "healthy" | "warning" | "critical"
  key_takeaways: string[]
}

export interface AIDashboardSummary {
  insights: AIInsight[]
  sales_forecast: AISalesForecastSummary
  purchasing_suggestions: AIPurchasingSuggestion[]
  stock_summary: AIStockAnalysisSummary
  financial_summary: AIFinancialAnalysisSummary
  quick_prompts: string[]
}

export interface AIAuditLog {
  id: string
  company_id: string
  user_id: string
  action_type: "query" | "insight_accepted" | "insight_dismissed" | "report_generated"
  prompt_summary?: string | null
  details?: Record<string, any>
  created_at: string
}
