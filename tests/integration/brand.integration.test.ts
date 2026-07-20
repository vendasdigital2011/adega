import { describe, it, expect, beforeAll } from "vitest"
import { brandService } from "@/services/BrandService"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("BrandService (integração)", () => {
  let createdId: string
  const uniqueName = `Marca Teste Vitest ${Date.now()}`

  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("cria uma marca", async () => {
    const created = await brandService.create({ name: uniqueName })
    expect(created.id).toBeTruthy()
    expect(created.active).toBe(true)
    createdId = created.id
  })

  it("rejeita nome duplicado", async () => {
    await expect(brandService.create({ name: uniqueName })).rejects.toMatchObject({ code: "DUPLICATE_NAME" })
  })

  it("lista com busca por nome", async () => {
    const result = await brandService.list({ search: uniqueName, page: 1, limit: 10 })
    expect(result.data.some((b) => b.id === createdId)).toBe(true)
  })

  it("desativa e reativa (soft delete)", async () => {
    const deactivated = await brandService.setActive(createdId, false)
    expect(deactivated.active).toBe(false)
    const reactivated = await brandService.setActive(createdId, true)
    expect(reactivated.active).toBe(true)
  })

  it("RLS: vendedor não consegue inserir marca", async () => {
    const vendedor = await signInAs("vendedor")
    const companies = await vendedor.from("companies").select("id").limit(1)
    const { error } = await vendedor
      .from("brands")
      .insert({ company_id: companies.data![0].id, name: `Marca Vendedor ${Date.now()}` })
    expect(error?.code).toBe("42501")
  })
})
