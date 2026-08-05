import { getSupabaseAdminClient } from "./supabase/admin"

export { getSupabaseAdminClient }

// Cliente admin de servidor usando a chave service role
export const supabaseAdmin = typeof process !== "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")
  ? getSupabaseAdminClient()
  : (null as unknown as ReturnType<typeof getSupabaseAdminClient>)
