import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/SaleService", () => ({
  saleService: { list: vi.fn(), getItems: vi.fn(), create: vi.fn(), cancel: vi.fn() },
}))

import { saleService } from "@/services/SaleService"
import { useSales, useSaleItems, useCreateSale, useCancelSale } from "@/features/sales/hooks/useSales"

describe("useSales hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useSales chama saleService.list", async () => {
    vi.mocked(saleService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSales({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(saleService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useSaleItems fica idle sem saleId", () => {
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSaleItems(null), { wrapper: Wrapper })
    expect(saleService.getItems).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("useCreateSale invalida vendas/estoque/caixa/contas a receber", async () => {
    vi.mocked(saleService.create).mockResolvedValue("new-id" as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateSale(), { wrapper: Wrapper })
    result.current.mutate({ customer_id: null, sale_date: "2026-01-01", discount: 0, payment_method: "PIX", items: [] })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const keys = spy.mock.calls.map((c) => (c[0] as any).queryKey[0])
    expect(keys).toEqual(expect.arrayContaining(["sales", "cash-open-register", "accounts-receivable"]))
  })

  it("useCancelSale chama saleService.cancel", async () => {
    vi.mocked(saleService.cancel).mockResolvedValue(undefined as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCancelSale(), { wrapper: Wrapper })
    result.current.mutate("s1")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(saleService.cancel).toHaveBeenCalledWith("s1")
  })
})
