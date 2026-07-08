import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

// Server-only client using the service role key.
// NEVER import this file from a "use client" component — it must stay on the server
// (Route Handlers / Server Actions only), otherwise the service role key would leak to the browser.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
