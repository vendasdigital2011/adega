import { describe, it, expect } from "vitest"
import { companySchema, preferencesSchema } from "@/features/settings/schemas/settings.schema"
import { roleSchema } from "@/features/users/schemas/role.schema"
import { createUserSchema, editUserSchema } from "@/features/users/schemas/user.schema"

describe("companySchema", () => {
  it("accepts a minimal valid company", () => {
    expect(companySchema.safeParse({ name: "Adega Modelo" }).success).toBe(true)
  })

  it("rejects a name shorter than 2 chars", () => {
    expect(companySchema.safeParse({ name: "A" }).success).toBe(false)
  })

  it("accepts a valid CPF or CNPJ document", () => {
    expect(companySchema.safeParse({ name: "Adega Modelo", document: "12345678901" }).success).toBe(true)
    expect(companySchema.safeParse({ name: "Adega Modelo", document: "12345678000199" }).success).toBe(true)
  })

  it("rejects a document with the wrong digit count", () => {
    expect(companySchema.safeParse({ name: "Adega Modelo", document: "123" }).success).toBe(false)
  })

  it("rejects a state longer than 2 chars", () => {
    expect(companySchema.safeParse({ name: "Adega Modelo", state: "São Paulo" }).success).toBe(false)
  })
})

describe("preferencesSchema", () => {
  it("accepts a valid combination", () => {
    expect(
      preferencesSchema.safeParse({
        theme: "dark",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }).success
    ).toBe(true)
  })

  it("rejects a theme outside light/dark/system", () => {
    expect(
      preferencesSchema.safeParse({
        theme: "blue",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }).success
    ).toBe(false)
  })
})

describe("roleSchema", () => {
  it("requires a name", () => {
    expect(roleSchema.safeParse({ name: "Gerente" }).success).toBe(true)
    expect(roleSchema.safeParse({ name: "" }).success).toBe(false)
  })
})

describe("createUserSchema", () => {
  const base = { name: "Novo Usuário", email: "novo@teste.com", password: "senha1234", role_id: "r1" }

  it("accepts a valid payload", () => {
    expect(createUserSchema.safeParse(base).success).toBe(true)
  })

  it("rejects an invalid email", () => {
    expect(createUserSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false)
  })

  it("rejects a password shorter than 8 chars", () => {
    expect(createUserSchema.safeParse({ ...base, password: "1234567" }).success).toBe(false)
  })

  it("rejects a missing role_id", () => {
    const { role_id, ...rest } = base
    expect(createUserSchema.safeParse(rest).success).toBe(false)
  })
})

describe("editUserSchema", () => {
  it("accepts a valid payload without password/email", () => {
    expect(editUserSchema.safeParse({ name: "Usuário Editado", role_id: "r1" }).success).toBe(true)
  })

  it("rejects a missing name", () => {
    expect(editUserSchema.safeParse({ name: "", role_id: "r1" }).success).toBe(false)
  })
})
