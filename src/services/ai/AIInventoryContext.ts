import { supabaseAdmin, getSupabaseAdminClient } from "@/lib/supabase-admin"

export interface InventoryContextData {
  total_products_count: number
  total_stock_value: number
  low_stock_products_count: number
  low_stock_items: Array<{ name: string; sku: string; current_stock: number; minimum_stock: number }>
  expiring_products_count: number
  details_summary: string
}

export class AIInventoryContext {
  public static async getContext(companyId: string): Promise<InventoryContextData> {
    const client = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
      ? supabaseAdmin
      : getSupabaseAdminClient()

    const { data: products, error } = await client
      .from("products")
      .select("name, sku, current_stock, minimum_stock, purchase_price, expiry_date")
      .eq("company_id", companyId)
      .eq("active", true)

    if (error) throw new Error(`SUPABASE_QUERY_ERROR: ${error.message}`)

    let lowStockCount = 0
    let totalVal = 0
    let expiringCount = 0
    const lowStockItems: Array<{ name: string; sku: string; current_stock: number; minimum_stock: number }> = []

    const today = new Date()
    const thirtyDaysAhead = new Date(today)
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)

    products?.forEach((p) => {
      const qty = Number(p.current_stock || 0)
      const min = Number(p.minimum_stock || 0)
      const price = Number(p.purchase_price || 0)
      totalVal += qty * price

      if (qty <= min) {
        lowStockCount++
        lowStockItems.push({
          name: p.name,
          sku: p.sku,
          current_stock: qty,
          minimum_stock: min,
        })
      }

      if (p.expiry_date) {
        const exp = new Date(p.expiry_date)
        if (exp <= thirtyDaysAhead) expiringCount++
      }
    })

    return {
      total_products_count: products?.length || 0,
      total_stock_value: Math.round(totalVal * 100) / 100,
      low_stock_products_count: lowStockCount,
      low_stock_items: lowStockItems.slice(0, 15),
      expiring_products_count: expiringCount,
      details_summary: `Total de Produtos: ${products?.length || 0}, Valor Total em Estoque: R$ ${totalVal.toLocaleString("pt-BR")}, Produtos no Estoque Mínimo: ${lowStockCount} item(ns).`,
    }
  }
}
