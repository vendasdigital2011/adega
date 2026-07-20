import { describe, it, expect, beforeAll } from "vitest"
import { supplierService } from "@/services/SupplierService"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("SupplierService (integração)", () => {
  let createdId: string
  const uniqueName = `Fornecedor Teste Vitest ${Date.now()}`
  const uniqueDoc = String(Date.now()).slice(-11).padStart(11, "1")

  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("cria um fornecedor com CPF/CNPJ e normaliza campos opcionais vazios", async () => {
    const created = await supplierService.create({
      name: uniqueName,
      document: uniqueDoc,
      phone: "11999999999",
      email: "",
    })
    expect(created.id).toBeTruthy()
    expect(created.email).toBeNull()
    createdId = created.id
  })

  it("rejeita documento duplicado", async () => {
    await expect(
      supplierService.create({ name: "Outro Nome", document: uniqueDoc, phone: "11999999999" })
    ).rejects.toMatchObject({ code: "DUPLICATE_DOCUMENT" })
  })

  it("lista com busca por documento", async () => {
    const result = await supplierService.list({ search: uniqueDoc, page: 1, limit: 10 })
    expect(result.data.some((s) => s.id === createdId)).toBe(true)
  })

  it("desativa e reativa", async () => {
    await supplierService.setActive(createdId, false)
    const reactivated = await supplierService.setActive(createdId, true)
    expect(reactivated.active).toBe(true)
  })

  it("RLS: vendedor não consegue inserir fornecedor", async () => {
    const vendedor = await signInAs("vendedor")
    const companies = await vendedor.from("companies").select("id").limit(1)
    const { error } = await vendedor.from("suppliers").insert({
      company_id: companies.data![0].id,
      name: "x",
      document: "99999999999",
      phone: "119999",
    })
    expect(error?.code).toBe("42501")
  })
})
