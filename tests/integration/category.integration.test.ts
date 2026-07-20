import { describe, it, expect, beforeAll } from "vitest"
import { categoryService } from "@/services/CategoryService"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

// Roda contra o Supabase real de desenvolvimento (não há Postgres local
// neste projeto) — mesmo padrão dos scripts headless manuais de cada sprint,
// agora formalizado em suíte permanente.
describe("CategoryService (integração)", () => {
  let createdId: string
  const uniqueName = `Categoria Teste Vitest ${Date.now()}`

  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("cria uma categoria", async () => {
    const created = await categoryService.create({ name: uniqueName, description: "criada pelo vitest" })
    expect(created.id).toBeTruthy()
    expect(created.name).toBe(uniqueName)
    expect(created.active).toBe(true)
    createdId = created.id
  })

  it("rejeita nome duplicado com mensagem amigável", async () => {
    await expect(categoryService.create({ name: uniqueName })).rejects.toMatchObject({
      code: "DUPLICATE_NAME",
    })
  })

  it("lista categorias com busca por nome", async () => {
    const result = await categoryService.list({ search: uniqueName, page: 1, limit: 10 })
    expect(result.data.some((c) => c.id === createdId)).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it("atualiza a descrição", async () => {
    const updated = await categoryService.update(createdId, { description: "atualizada pelo vitest" })
    expect(updated.description).toBe("atualizada pelo vitest")
  })

  it("desativa (soft delete) via setActive", async () => {
    const deactivated = await categoryService.setActive(createdId, false)
    expect(deactivated.active).toBe(false)

    const result = await categoryService.list({ active: true, search: uniqueName, page: 1, limit: 10 })
    expect(result.data.find((c) => c.id === createdId)).toBeUndefined()
  })

  it("reativa a categoria de teste (limpeza, nunca hard-delete)", async () => {
    const reactivated = await categoryService.setActive(createdId, true)
    expect(reactivated.active).toBe(true)
  })

  it("RLS: vendedor sem categories.create não consegue inserir", async () => {
    const vendedor = await signInAs("vendedor")
    const companies = await vendedor.from("companies").select("id").limit(1)
    const { error } = await vendedor.from("categories").insert({
      company_id: companies.data![0].id,
      name: `Categoria Vendedor ${Date.now()}`,
    })
    expect(error).toBeTruthy()
    expect(error!.code).toBe("42501")
  })
})
