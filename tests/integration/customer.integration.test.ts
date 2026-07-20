import { describe, it, expect, beforeAll } from "vitest"
import { customerService } from "@/services/CustomerService"
import { loginAppClientAs } from "./helpers/appAuth"

describe("CustomerService (integração)", () => {
  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("cria um cliente só com nome (documento é opcional)", async () => {
    const created = await customerService.create({ name: `Cliente Sem Doc ${Date.now()}` })
    expect(created.id).toBeTruthy()
    expect(created.document).toBeNull()
  })

  it("permite dois clientes sem documento (índice único parcial)", async () => {
    const a = await customerService.create({ name: `Cliente A ${Date.now()}` })
    const b = await customerService.create({ name: `Cliente B ${Date.now()}` })
    expect(a.document).toBeNull()
    expect(b.document).toBeNull()
  })

  it("rejeita documento duplicado quando informado", async () => {
    const doc = String(Date.now()).slice(-11).padStart(11, "2")
    await customerService.create({ name: "Cliente Doc 1", document: doc })
    await expect(customerService.create({ name: "Cliente Doc 2", document: doc })).rejects.toMatchObject({
      code: "DUPLICATE_DOCUMENT",
    })
  })

  it("normaliza string vazia em document para null", async () => {
    const created = await customerService.create({ name: "Cliente Doc Vazio", document: "" })
    expect(created.document).toBeNull()
  })

  it("lista clientes com busca por nome", async () => {
    const name = `Cliente Busca Vitest ${Date.now()}`
    await customerService.create({ name })
    const result = await customerService.list({ search: name, page: 1, limit: 10 })
    expect(result.data.some((c) => c.name === name)).toBe(true)
  })

  it("atualiza o telefone de um cliente", async () => {
    const created = await customerService.create({ name: "Cliente Update Vitest" })
    const updated = await customerService.update(created.id, { phone: "11988887777" })
    expect(updated.phone).toBe("11988887777")
  })

  it("rejeita documento duplicado ao atualizar para um já existente", async () => {
    const doc = String(Date.now()).slice(-11).padStart(11, "4")
    await customerService.create({ name: "Cliente Doc Base", document: doc })
    const other = await customerService.create({ name: "Cliente Doc Alvo" })
    await expect(customerService.update(other.id, { document: doc })).rejects.toMatchObject({
      code: "DUPLICATE_DOCUMENT",
    })
  })

  it("desativa e reativa via setActive", async () => {
    const created = await customerService.create({ name: "Cliente SetActive Vitest" })
    const deactivated = await customerService.setActive(created.id, false)
    expect(deactivated.active).toBe(false)
    const reactivated = await customerService.setActive(created.id, true)
    expect(reactivated.active).toBe(true)
  })
})
