import { supabase } from "@/lib/supabase"
import { TEST_USERS, Actor } from "./testClient"

// Os *Services* do app (CategoryService, BrandService, ...) usam o client
// singleton de src/lib/supabase.ts (import direto, não injeção de
// dependência) — para exercitar o código real do service (não só a tabela
// via REST cru) é preciso autenticar esse MESMO singleton.
export async function loginAppClientAs(actor: Actor) {
  const { email, password } = TEST_USERS[actor]
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Falha ao logar client do app como ${actor}: ${error.message}`)
}

export async function logoutAppClient() {
  await supabase.auth.signOut()
}
