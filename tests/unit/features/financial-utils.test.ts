import { describe, it, expect, vi, afterEach } from "vitest"
import { displayStatus } from "@/features/financial/utils"

describe("displayStatus", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the settled label/variant when status matches settledLabel", () => {
    expect(displayStatus("Recebida", "2026-01-01", "Recebida")).toEqual({
      label: "Recebida",
      variant: "success",
    })
  })

  it("returns Cancelada as-is regardless of due date", () => {
    expect(displayStatus("Cancelada", "2020-01-01", "Recebida")).toEqual({
      label: "Cancelada",
      variant: "secondary",
    })
  })

  it("returns Vencida when Aberta/Parcial and due date is in the past", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"))
    expect(displayStatus("Aberta", "2026-07-10", "Recebida")).toEqual({
      label: "Vencida",
      variant: "destructive",
    })
    expect(displayStatus("Parcial", "2026-07-10", "Recebida")).toEqual({
      label: "Vencida",
      variant: "destructive",
    })
  })

  it("returns Parcial when not overdue and status is Parcial", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"))
    expect(displayStatus("Parcial", "2026-12-31", "Recebida")).toEqual({
      label: "Parcial",
      variant: "warning",
    })
  })

  it("returns Aberta when not overdue and not Parcial", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T12:00:00Z"))
    expect(displayStatus("Aberta", "2026-12-31", "Recebida")).toEqual({
      label: "Aberta",
      variant: "default",
    })
  })

  it("a due date of today is not yet overdue", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T23:59:00Z"))
    expect(displayStatus("Aberta", "2026-07-17", "Recebida").label).toBe("Aberta")
  })
})
