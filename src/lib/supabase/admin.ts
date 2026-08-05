import { createClient } from "@supabase/supabase-js"

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://unconfigured-supabase.local"
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "unconfigured-service-key"

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
