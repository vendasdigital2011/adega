import { supabaseAdmin, getSupabaseAdminClient } from "@/lib/supabase-admin"

export interface CashContextData {
  status: "aberto" | "fechado"
  initial_value: number
  opened_at?: string
  details_summary: string
}

export class AICashContext {
  public static async getContext(companyId: string): Promise<CashContextData> {
    const client = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")
      ? supabaseAdmin
      : getSupabaseAdminClient()

    const { data: cash, error } = await client
      .from("cash_registers")
      .select("status, initial_value, opened_at")
      .eq("company_id", companyId)
      .order("opened_at", { ascending: false })
      .limit(1)

    if (error) throw new Error(`SUPABASE_QUERY_ERROR: ${error.message}`)

    if (!cash || cash.length === 0 || cash[0].status === "fechado") {
      return {
        status: "fechado",
        initial_value: 0,
        details_summary: "Status do Caixa: FECHADO. O caixa atual encontra-se fechado para vendas.",
      }
    }

    const openCash = cash[0]
    return {
      status: "aberto",
      initial_value: Number(openCash.initial_value || 0),
      opened_at: openCash.opened_at,
      details_summary: `Status do Caixa: ABERTO em ${new Date(openCash.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} com R$ ${Number(openCash.initial_value || 0).toLocaleString("pt-BR")} de troco inicial.`,
    }
  }
}
