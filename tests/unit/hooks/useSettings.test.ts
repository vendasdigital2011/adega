import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/SettingsService", () => ({
  settingsService: {
    getCompany: vi.fn(),
    updateCompany: vi.fn(),
    getSettings: vi.fn(),
    upsertSettings: vi.fn(),
    exportBackup: vi.fn(),
  },
}))

import { settingsService } from "@/services/SettingsService"
import {
  useCompany,
  useUpdateCompany,
  useSettings,
  useUpsertSettings,
  useExportBackup,
} from "@/features/settings/hooks/useSettings"

describe("useSettings hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useCompany / useSettings leem os dados atuais", async () => {
    vi.mocked(settingsService.getCompany).mockResolvedValue({ id: "c1", name: "Adega Modelo" } as any)
    vi.mocked(settingsService.getSettings).mockResolvedValue(null)
    const { Wrapper } = createQueryWrapper()

    const { result: company } = renderHook(() => useCompany(), { wrapper: Wrapper })
    await waitFor(() => expect(company.current.isSuccess).toBe(true))
    expect(company.current.data?.name).toBe("Adega Modelo")

    const { result: settings } = renderHook(() => useSettings(), { wrapper: Wrapper })
    await waitFor(() => expect(settings.current.isSuccess).toBe(true))
    expect(settings.current.data).toBeNull()
  })

  it("useUpdateCompany invalida settings-company", async () => {
    vi.mocked(settingsService.updateCompany).mockResolvedValue({ id: "c1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useUpdateCompany(), { wrapper: Wrapper })
    result.current.mutate({ name: "Nova Razão Social" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["settings-company"] })
  })

  it("useUpsertSettings invalida settings", async () => {
    vi.mocked(settingsService.upsertSettings).mockResolvedValue({ id: "s1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useUpsertSettings(), { wrapper: Wrapper })
    result.current.mutate({ theme: "dark", currency: "BRL", timezone: "America/Sao_Paulo", language: "pt-BR" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["settings"] })
  })

  it("useExportBackup chama settingsService.exportBackup", async () => {
    vi.mocked(settingsService.exportBackup).mockResolvedValue({ exported_at: "now", tables: {} })
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useExportBackup(), { wrapper: Wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(settingsService.exportBackup).toHaveBeenCalled()
  })
})
