import { createBrowserClient } from "@supabase/ssr"

export const PRODUCTION_SUPABASE_URL = "https://yqhwtgaqxgptletgxklr.supabase.co"
export const PRODUCTION_SUPABASE_ANON_KEY = "sb_publishable_GL13qCWkRt35fIQGE6_T3Q_ctp2XCEq"

export function getValidSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    PRODUCTION_SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    PRODUCTION_SUPABASE_ANON_KEY
  return { url, key }
}

// Cliente oficial de navegador com fallback seguro para a instância da Adega
export function createBrowserSupabaseClient() {
  const { url, key } = getValidSupabaseEnv()
  return createBrowserClient(url, key)
}

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserSupabaseClient() {
  if (!browserClientInstance) {
    browserClientInstance = createBrowserSupabaseClient()
  }
  return browserClientInstance
}

export const supabase = typeof window !== "undefined"
  ? getBrowserSupabaseClient()
  : createBrowserClient(PRODUCTION_SUPABASE_URL, PRODUCTION_SUPABASE_ANON_KEY)

