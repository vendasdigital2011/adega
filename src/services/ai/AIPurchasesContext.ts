import { getSupabaseAdminClient } from "@/lib/supabase/admin"

export interface PurchasesContextData {
  suppliers_count: number
  total_purchases_month: number
  details_summary: string
}

export class AIPurchasesContext {
  public static async getContext(companyId: string): Promise<PurchasesContextData> {
    try {
      const client = getSupabaseAdminClient()

      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      const [suppliersRes, purchasesRes] = await Promise.all([
        client.from("suppliers").select("id").eq("company_id", companyId).eq("active", true),
        client.from("purchases").select("total_amount").eq("company_id", companyId).gte("issue_date", firstDayOfMonth),
      ])

      let totalPurchases = 0
      purchasesRes.data?.forEach((p) => {
        totalPurchases += Number(p.total_amount || 0)
      })

      return {
        suppliers_count: suppliersRes.data?.length || 0,
        total_purchases_month: Math.round(totalPurchases * 100) / 100,
        details_summary: `Fornecedores Ativos: ${suppliersRes.data?.length || 0}, Compras no Mês: R$ ${totalPurchases.toLocaleString("pt-BR")}.`,
      }
    } catch (e) {
      return {
        suppliers_count: 0,
        total_purchases_month: 0,
        details_summary: "Informações de fornecedores e compras não registradas.",
      }
    }
  }
}
