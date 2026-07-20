import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/DashboardService", () => ({
  dashboardService: { getSummary: vi.fn() },
}))

import { dashboardService } from "@/services/DashboardService"
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary"

describe("useDashboardSummary", () => {
  beforeEach(() => vi.clearAllMocks())

  it("chama dashboardService.getSummary e retorna o resumo", async () => {
    vi.mocked(dashboardService.getSummary).mockResolvedValue({ todayTotal: 100 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useDashboardSummary(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.todayTotal).toBe(100)
  })
})
