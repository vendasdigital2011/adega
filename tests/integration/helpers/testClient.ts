import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Testes de integração rodam contra o Supabase real de desenvolvimento —
// este projeto não tem CLI/Postgres local. Cada actor recebe seu próprio
// client (sessão independente), o mesmo padrão usado nos scripts headless
// manuais de cada sprint anterior, agora formalizado em suíte permanente.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const TEST_USERS = {
  admin: { email: "teste@teste.com", password: "teste1234" },
  vendedor: { email: "vendedor@teste.com", password: "vendedor1234" },
} as const

export type Actor = keyof typeof TEST_USERS

export function createTestClient(): SupabaseClient {
  if (!URL || !ANON_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes — confira .env.local na raiz do projeto."
    )
  }
  return createClient(URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function signInAs(actor: Actor): Promise<SupabaseClient> {
  const client = createTestClient()
  const { email, password } = TEST_USERS[actor]
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Falha ao logar como ${actor}: ${error.message}`)
  return client
}

export function anonClient(): SupabaseClient {
  return createTestClient()
}
