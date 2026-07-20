import { describe, it, expect, beforeAll } from "vitest"
import { userService } from "@/services/UserService"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"
import { TEST_USERS, signInAs } from "./helpers/testClient"

// UserService.create() faz fetch("/api/users") — uma Route Handler do Next —
// e por isso exige um servidor rodando; fora de escopo para um teste de
// integração puro contra o Supabase. list/update/updateStatus vão direto ao
// banco e são cobertos aqui.
describe("UserService (integração)", () => {
  let vendedorId: string
  let originalName: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
    const { data } = await supabase.from("users").select("id, name").eq("email", TEST_USERS.vendedor.email).single()
    vendedorId = data!.id
    originalName = data!.name
  })

  it("lista usuários da empresa com busca por nome", async () => {
    const result = await userService.list({ search: "Vendedor", page: 1, limit: 10 })
    expect(result.data.some((u) => u.id === vendedorId)).toBe(true)
  })

  it("filtra por status", async () => {
    const result = await userService.list({ status: "active", page: 1, limit: 10 })
    expect(result.data.every((u) => u.status === "active")).toBe(true)
  })

  it("filtra por roleId", async () => {
    const { data: vendedorRow } = await supabase.from("users").select("role_id").eq("id", vendedorId).single()
    const result = await userService.list({ roleId: vendedorRow!.role_id, page: 1, limit: 10 })
    expect(result.data.every((u) => u.role_id === vendedorRow!.role_id)).toBe(true)
  })

  it("atualiza o nome e restaura em seguida", async () => {
    const updated = await userService.update(vendedorId, { name: "Vendedor Teste Vitest" })
    expect(updated.name).toBe("Vendedor Teste Vitest")
    await userService.update(vendedorId, { name: originalName })
  })

  it("updateStatus mantém o vendedor ativo (no-op seguro, não derruba a conta de teste)", async () => {
    const updated = await userService.updateStatus(vendedorId, "active")
    expect(updated.status).toBe("active")
  })

  it("RLS: vendedor pode LER colegas da mesma empresa (directory, sem permissão extra)...", async () => {
    // users_select_same_company (0001) é intencionalmente amplo — outras
    // telas (audit_logs, cash_registers) fazem join em users(name,email) e
    // precisam disso para qualquer usuário, não só quem tem users.view.
    const vendedor = await signInAs("vendedor")
    const { data, error } = await vendedor.from("users").select("id")
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it("...mas não consegue EDITAR outro usuário (sem users.edit)", async () => {
    // a policy de update exige id = auth.uid() OU users.edit — vendedor não
    // tem users.edit, então só pode alterar o próprio registro, nunca o de
    // um colega.
    const vendedor = await signInAs("vendedor")
    const admin = await signInAs("admin")
    const { data: adminRow } = await admin.from("users").select("id").eq("email", TEST_USERS.admin.email).single()

    const attack = await vendedor.from("users").update({ name: "Hackeado" }).eq("id", adminRow!.id).select()
    expect(attack.data).toEqual([])
  })
})
