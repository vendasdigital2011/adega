import { getBrowserSupabaseClient } from "./supabase/client"

// Re-exporta o cliente de navegador oficial e centralizado
export const supabase = typeof window !== "undefined"
  ? getBrowserSupabaseClient()
  : (null as unknown as ReturnType<typeof getBrowserSupabaseClient>)
