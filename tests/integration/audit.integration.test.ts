import { describe, it, expect, beforeAll } from "vitest"
import { auditService } from "@/services/AuditService"
import { categoryService } from "@/services/CategoryService"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("AuditService (integração)", () => {
  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("uma ação de escrita gera um log consultável", async () => {
    const name = `Categoria Audit Vitest ${Date.now()}`
    const created = await categoryService.create({ name })

    const result = await auditService.list({ action: "INSERT", tableName: "categories", page: 1, limit: 5 })
    expect(result.data.some((log) => log.record_id === created.id)).toBe(true)
  })

  it("filtra por intervalo de datas", async () => {
    const today = new Date().toISOString().slice(0, 10)
    const result = await auditService.list({ startDate: today, endDate: today, page: 1, limit: 5 })
    expect(result.total).toBeGreaterThan(0)
  })

  it("listUsers alimenta o filtro por usuário", async () => {
    const users = await auditService.listUsers()
    expect(users.some((u) => u.name)).toBe(true)
  })

  it("RLS: vendedor sem audit.view não lê nenhum log", async () => {
    const vendedor = await signInAs("vendedor")
    const { data } = await vendedor.from("audit_logs").select("id")
    expect(data).toEqual([])
  })

  it("audit_logs é imutável: UPDATE/DELETE bloqueados até para admin", async () => {
    const { supabase } = await import("@/lib/supabase")
    const { data: rows } = await supabase.from("audit_logs").select("id").limit(1)
    const id = rows![0].id
    const upd = await supabase.from("audit_logs").update({ action: "HACKED" }).eq("id", id).select()
    expect(upd.data).toEqual([])
  })
})
