import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface ProductRankingItem {
  id: string
  name: string
  sku: string
  total_quantity: number
  total_revenue: number
  current_stock: number
  last_sale_date?: string
  days_without_sales?: number
}

export interface ProductsContextData {
  top_selling_by_quantity: ProductRankingItem[]
  top_selling_by_revenue: ProductRankingItem[]
  slow_moving_items: ProductRankingItem[]
  no_movement_items: ProductRankingItem[]
  summary_text: string
}

export class AIProductsContext {
  public static async getContext(companyId: string, startDate?: string, endDate?: string): Promise<ProductsContextData> {
    try {
      const supabase = await createServerSupabaseClient()

      // 1. Busca catálogo de produtos da empresa
      const { data: products } = await supabase
        .from("products")
        .select("id, name, sku, current_stock, sale_price, cost_price")
        .eq("company_id", companyId)
        .eq("active", true)

      if (!products || products.length === 0) {
        return {
          top_selling_by_quantity: [],
          top_selling_by_revenue: [],
          slow_moving_items: [],
          no_movement_items: [],
          summary_text: "Nenhum produto cadastrado no catálogo.",
        }
      }

      // 2. Busca itens de vendas no período
      let salesQuery = supabase
        .from("sales")
        .select("id, sale_date, sale_items(product_id, quantity, unit_price, total)")
        .eq("company_id", companyId)
        .eq("status", "finalizada")

      if (startDate) salesQuery = salesQuery.gte("sale_date", startDate)
      if (endDate) salesQuery = salesQuery.lte("sale_date", endDate)

      const { data: sales } = await salesQuery

      const productSalesMap = new Map<string, { quantity: number; revenue: number; lastSaleDate: string }>()

      if (sales) {
        sales.forEach((s: any) => {
          if (s.sale_items) {
            s.sale_items.forEach((item: any) => {
              const prev = productSalesMap.get(item.product_id) || { quantity: 0, revenue: 0, lastSaleDate: s.sale_date }
              const newDate = !prev.lastSaleDate || new Date(s.sale_date) > new Date(prev.lastSaleDate) ? s.sale_date : prev.lastSaleDate
              productSalesMap.set(item.product_id, {
                quantity: prev.quantity + Number(item.quantity || 0),
                revenue: prev.revenue + Number(item.total || 0),
                lastSaleDate: newDate,
              })
            })
          }
        })
      }

      const now = new Date().getTime()

      const allRanked: ProductRankingItem[] = products.map((p) => {
        const stats = productSalesMap.get(p.id)
        const daysWithoutSales = stats?.lastSaleDate
          ? Math.floor((now - new Date(stats.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          total_quantity: stats?.quantity || 0,
          total_revenue: stats?.revenue || 0,
          current_stock: p.current_stock,
          last_sale_date: stats?.lastSaleDate,
          days_without_sales: daysWithoutSales,
        }
      })

      // Top 5 mais vendidos por quantidade
      const topQuantity = [...allRanked].sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 5)
      // Top 5 por faturamento
      const topRevenue = [...allRanked].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5)
      // Baixo giro (estoque > 0 e poucas vendas)
      const slowMoving = [...allRanked].filter((p) => p.current_stock > 0 && p.total_quantity <= 2).slice(0, 5)
      // Sem movimentação (sem vendas no período)
      const noMovement = [...allRanked].filter((p) => p.total_quantity === 0 && p.current_stock > 0).slice(0, 5)

      const summaryText = `Top Vendas: ${topQuantity.map((p) => `${p.name} (${p.total_quantity} un)`).join(", ") || "Sem registros"}. Parados/Baixo Giro: ${noMovement.map((p) => `${p.name} (${p.current_stock} un em estoque)`).join(", ") || "Nenhum"}`

      return {
        top_selling_by_quantity: topQuantity,
        top_selling_by_revenue: topRevenue,
        slow_moving_items: slowMoving,
        no_movement_items: noMovement,
        summary_text: summaryText,
      }
    } catch (e) {
      return {
        top_selling_by_quantity: [],
        top_selling_by_revenue: [],
        slow_moving_items: [],
        no_movement_items: [],
        summary_text: "Informações de giro de produtos indisponíveis no momento.",
      }
    }
  }
}
