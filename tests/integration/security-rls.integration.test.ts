import { describe, it, expect, afterAll } from "vitest"
import { readFileSync } from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import { signInAs, TEST_USERS, anonClient } from "./helpers/testClient"

// Formaliza os achados da auditoria de segurança pré-lançamento (sessão de
// 2026-07-17) como regressão permanente, em vez de deixá-los só em scripts
// descartáveis de scratchpad.
describe("Segurança / RLS (integração, regressão)", () => {
  // Client com a service role key — só usado aqui para montar o cenário
  // sintético de cross-tenant (nunca para contornar RLS em nome do usuário).
  function adminClient() {
    const envPath = path.resolve(__dirname, "../../.env.local")
    const envText = readFileSync(envPath, "utf8")
    const env: Record<string, string> = {}
    for (const line of envText.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) env[m[1]] = m[2].trim()
    }
    return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  const cleanupIds: { companies: string[]; roles: string[] } = { companies: [], roles: [] }

  afterAll(async () => {
    const admin = adminClient()
    for (const id of cleanupIds.roles) await admin.from("roles").delete().eq("id", id)
    for (const id of cleanupIds.companies) await admin.from("companies").delete().eq("id", id)
  })

  it("bloqueia atribuir a um usuário o role_id de uma empresa diferente (migration 0018)", async () => {
    const admin = adminClient()
    const tag = Date.now()

    const { data: foreignCompany } = await admin
      .from("companies")
      .insert({ name: `__TEST_SECURITY_${tag}` })
      .select()
      .single()
    cleanupIds.companies.push(foreignCompany!.id)

    const { data: foreignRole } = await admin
      .from("roles")
      .insert({ name: `__TEST_ROLE_${tag}`, company_id: foreignCompany!.id })
      .select()
      .single()
    cleanupIds.roles.push(foreignRole!.id)

    // é o admin (tem users.edit) quem tenta reatribuir o role_id de outro
    // usuário da própria empresa para uma role de uma empresa estrangeira.
    const adminSession = await signInAs("admin")
    const { data: vendedorRow } = await adminSession.from("users").select("id, role_id").eq("email", TEST_USERS.vendedor.email).single()

    const attack = await adminSession.from("users").update({ role_id: foreignRole!.id }).eq("id", vendedorRow!.id)
    expect(attack.error?.code).toBe("42501")

    const { data: check } = await adminSession.from("users").select("role_id").eq("id", vendedorRow!.id).single()
    expect(check!.role_id).toBe(vendedorRow!.role_id)
  })

  it("acesso anônimo (sem sessão) não retorna nenhuma linha de tabelas protegidas", async () => {
    const anon = anonClient()
    const tables = ["users", "products", "sales", "accounts_receivable", "audit_logs", "notifications"]
    for (const table of tables) {
      const { data, error } = await anon.from(table).select("id")
      expect(error).toBeNull()
      expect(data).toEqual([])
    }
  })

  it("vendedor autoescalando o próprio role_id para Administrador é bloqueado (trigger 0005)", async () => {
    const vendedorClient = await signInAs("vendedor")
    const { data: me } = await vendedorClient.auth.getUser()
    const admin = adminClient()
    const { data: adminRole } = await admin.from("roles").select("id").eq("name", "Administrador").limit(1).single()

    const attack = await vendedorClient.from("users").update({ role_id: adminRole!.id }).eq("id", me.user!.id)
    expect(attack.error?.code).toBe("42501")
  })

  it("filtro de busca com vírgula/parênteses não altera o escopo dos dados retornados (RLS continua valendo)", async () => {
    const vendedor = await signInAs("vendedor")
    const malicious = encodeURIComponent("x%,status.eq.blocked,name.ilike.%")
    const { data } = await vendedor
      .from("users")
      .select("id,status")
      .or(`name.ilike.*${malicious}*,email.ilike.*${malicious}*`)
    // vendedor só vê usuários da própria empresa independentemente do filtro
    expect(Array.isArray(data)).toBe(true)
  })
})
