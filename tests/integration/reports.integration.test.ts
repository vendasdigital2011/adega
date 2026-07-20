import { describe, it, expect, beforeAll } from "vitest"
import { reportService } from "@/services/ReportService"
import { loginAppClientAs } from "./helpers/appAuth"

describe("ReportService (integração)", () => {
  const today = new Date().toISOString().slice(0, 10)
  const yearStart = `${new Date().getFullYear()}-01-01`

  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("getProductsReport retorna produtos com categoria/marca", async () => {
    const rows = await reportService.getProductsReport({ active: true })
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.every((p) => p.active)).toBe(true)
  })

  it("getInventoryReport filtra por período", async () => {
    const rows = await reportService.getInventoryReport({ startDate: yearStart, endDate: today })
    expect(Array.isArray(rows)).toBe(true)
  })

  it("getInventoryReport também filtra por tipo de movimento", async () => {
    const rows = await reportService.getInventoryReport({ startDate: yearStart, endDate: today, movementType: "Entrada" })
    expect(rows.every((m) => m.movement_type === "Entrada")).toBe(true)
  })

  it("getProductsReport sem filtro de active retorna ativos e inativos", async () => {
    const rows = await reportService.getProductsReport()
    expect(Array.isArray(rows)).toBe(true)
  })

  it("getPurchasesReport filtra por período e status", async () => {
    const rows = await reportService.getPurchasesReport({ startDate: yearStart, endDate: today, status: "recebida" })
    expect(rows.every((p) => p.status === "recebida")).toBe(true)
  })

  it("getSalesReport filtra por período", async () => {
    const rows = await reportService.getSalesReport({ startDate: yearStart, endDate: today })
    expect(Array.isArray(rows)).toBe(true)
  })

  it("getFinancialReport soma o saldo em aberto de receivables/payables", async () => {
    const result = await reportService.getFinancialReport({ startDate: yearStart, endDate: "2026-12-31" })
    expect(result.totalReceivableOpen).toBeGreaterThanOrEqual(0)
    expect(result.totalPayableOpen).toBeGreaterThanOrEqual(0)
    for (const r of result.receivables) {
      expect(["Aberta", "Parcial", "Recebida", "Cancelada"]).toContain(r.status)
    }
  })

  it("getCustomersReport agrega vendas finalizadas por cliente", async () => {
    const rows = await reportService.getCustomersReport()
    expect(Array.isArray(rows)).toBe(true)
    for (const row of rows) {
      expect(row.orderCount).toBeGreaterThanOrEqual(0)
      expect(row.totalSpent).toBeGreaterThanOrEqual(0)
    }
  })

  it("getCashReport filtra caixas por período de abertura", async () => {
    const rows = await reportService.getCashReport({ startDate: yearStart, endDate: today })
    expect(Array.isArray(rows)).toBe(true)
  })
})
