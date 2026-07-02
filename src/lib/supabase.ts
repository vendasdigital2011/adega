import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"

// Singleton client for browser/client-side usage.
// Uses @supabase/ssr so the session is persisted in cookies (not localStorage),
// which is what allows middleware.ts to read/validate the session on each request.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
