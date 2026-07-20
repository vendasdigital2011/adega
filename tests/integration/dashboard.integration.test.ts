import { describe, it, expect, beforeAll } from "vitest"
import { dashboardService } from "@/services/DashboardService"
import { loginAppClientAs } from "./helpers/appAuth"

describe("DashboardService (integração)", () => {
  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("getSummary retorna o resumo com os totais coerentes entre si", async () => {
    const summary = await dashboardService.getSummary()
    expect(summary.todayOrders).toBeGreaterThanOrEqual(0)
    expect(summary.totalCustomers).toBeGreaterThan(0)
    expect(summary.recentSales.length).toBeLessThanOrEqual(5)
    expect(summary.lowStockCount).toBeGreaterThanOrEqual(0)
  })
})
