import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/ReportService", () => ({
  reportService: {
    getProductsReport: vi.fn(),
    getInventoryReport: vi.fn(),
    getPurchasesReport: vi.fn(),
    getSalesReport: vi.fn(),
    getFinancialReport: vi.fn(),
    getCustomersReport: vi.fn(),
    getCashReport: vi.fn(),
  },
}))

import { reportService } from "@/services/ReportService"
import {
  useProductsReport,
  useInventoryReport,
  usePurchasesReport,
  useSalesReport,
  useFinancialReport,
  useCustomersReport,
  useCashReport,
} from "@/features/reports/hooks/useReports"

describe("useReports hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("cada hook chama o método correspondente do ReportService", async () => {
    vi.mocked(reportService.getProductsReport).mockResolvedValue([])
    vi.mocked(reportService.getInventoryReport).mockResolvedValue([])
    vi.mocked(reportService.getPurchasesReport).mockResolvedValue([])
    vi.mocked(reportService.getSalesReport).mockResolvedValue([])
    vi.mocked(reportService.getFinancialReport).mockResolvedValue({} as any)
    vi.mocked(reportService.getCustomersReport).mockResolvedValue([])
    vi.mocked(reportService.getCashReport).mockResolvedValue([])

    const { Wrapper } = createQueryWrapper()
    const range = { startDate: "2026-01-01", endDate: "2026-01-31" }

    const hooks = [
      renderHook(() => useProductsReport({}), { wrapper: Wrapper }),
      renderHook(() => useInventoryReport(range), { wrapper: Wrapper }),
      renderHook(() => usePurchasesReport(range), { wrapper: Wrapper }),
      renderHook(() => useSalesReport(range), { wrapper: Wrapper }),
      renderHook(() => useFinancialReport(range), { wrapper: Wrapper }),
      renderHook(() => useCustomersReport(), { wrapper: Wrapper }),
      renderHook(() => useCashReport(range), { wrapper: Wrapper }),
    ]

    for (const { result } of hooks) {
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    }

    expect(reportService.getProductsReport).toHaveBeenCalledWith({})
    expect(reportService.getInventoryReport).toHaveBeenCalledWith(range)
    expect(reportService.getPurchasesReport).toHaveBeenCalledWith(range)
    expect(reportService.getSalesReport).toHaveBeenCalledWith(range)
    expect(reportService.getFinancialReport).toHaveBeenCalledWith(range)
    expect(reportService.getCustomersReport).toHaveBeenCalled()
    expect(reportService.getCashReport).toHaveBeenCalledWith(range)
  })
})
