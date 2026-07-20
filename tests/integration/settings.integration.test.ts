import { describe, it, expect, beforeAll } from "vitest"
import { settingsService } from "@/services/SettingsService"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("SettingsService (integração)", () => {
  let originalCompanyName: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
    const company = await settingsService.getCompany()
    originalCompanyName = company.name
  })

  it("getCompany retorna a empresa do usuário logado", async () => {
    const company = await settingsService.getCompany()
    expect(company.id).toBeTruthy()
    expect(company.name).toBe(originalCompanyName)
  })

  it("updateCompany persiste e normaliza string vazia para null, depois restaura", async () => {
    const updated = await settingsService.updateCompany({ name: originalCompanyName, city: "" })
    expect(updated.city).toBeNull()

    // restaura o nome original (não deixa dado de teste na empresa real)
    await settingsService.updateCompany({ name: originalCompanyName })
    const restored = await settingsService.getCompany()
    expect(restored.name).toBe(originalCompanyName)
  })

  it("upsertSettings grava preferências e getSettings as lê de volta", async () => {
    const before = await settingsService.getSettings()
    await settingsService.upsertSettings({ theme: "dark", currency: "BRL", timezone: "America/Sao_Paulo", language: "pt-BR" })
    const after = await settingsService.getSettings()
    expect(after?.theme).toBe("dark")

    if (before) {
      await settingsService.upsertSettings({
        theme: before.theme,
        currency: before.currency,
        timezone: before.timezone,
        language: before.language,
      })
    }
  })

  it("exportBackup retorna todas as tabelas permitidas por RLS", async () => {
    const backup = await settingsService.exportBackup()
    expect(backup.exported_at).toBeTruthy()
    expect(Object.keys(backup.tables)).toContain("products")
    expect(Object.keys(backup.tables)).toContain("sales")
  })

  it("RLS: vendedor sem settings.view não consegue ler settings", async () => {
    const vendedor = await signInAs("vendedor")
    const { data } = await vendedor.from("settings").select("*")
    expect(data).toEqual([])
  })
})
