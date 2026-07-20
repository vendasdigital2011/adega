import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/PurchaseService", () => ({
  purchaseService: { list: vi.fn(), getItems: vi.fn(), create: vi.fn(), receive: vi.fn(), cancel: vi.fn() },
}))

import { purchaseService } from "@/services/PurchaseService"
import {
  usePurchases,
  usePurchaseItems,
  useCreatePurchase,
  useReceivePurchase,
  useCancelPurchase,
} from "@/features/purchases/hooks/usePurchases"

describe("usePurchases hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("usePurchases chama purchaseService.list", async () => {
    vi.mocked(purchaseService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePurchases({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(purchaseService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("usePurchaseItems só roda quando purchaseId não é null", async () => {
    vi.mocked(purchaseService.getItems).mockResolvedValue([] as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePurchaseItems(null), { wrapper: Wrapper })
    expect(result.current.fetchStatus).toBe("idle")
    expect(purchaseService.getItems).not.toHaveBeenCalled()
  })

  it("usePurchaseItems busca os itens quando há um id", async () => {
    vi.mocked(purchaseService.getItems).mockResolvedValue([{ id: "i1" }] as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => usePurchaseItems("p1"), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(purchaseService.getItems).toHaveBeenCalledWith("p1")
  })

  it("useCreatePurchase invalida purchases", async () => {
    vi.mocked(purchaseService.create).mockResolvedValue("new-id" as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreatePurchase(), { wrapper: Wrapper })
    result.current.mutate({ supplier_id: "s1", purchase_date: "2026-01-01", freight: 0, discount: 0, items: [] })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["purchases"] })
  })

  it("useReceivePurchase invalida purchases/products/estoque/contas a pagar", async () => {
    vi.mocked(purchaseService.receive).mockResolvedValue(undefined as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useReceivePurchase(), { wrapper: Wrapper })
    result.current.mutate("p1")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(purchaseService.receive).toHaveBeenCalledWith("p1")
    const keys = spy.mock.calls.map((c) => (c[0] as any).queryKey[0])
    expect(keys).toEqual(
      expect.arrayContaining(["purchases", "products", "accounts-payable", "inventory-movements"])
    )
  })

  it("useCancelPurchase chama purchaseService.cancel", async () => {
    vi.mocked(purchaseService.cancel).mockResolvedValue(undefined as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCancelPurchase(), { wrapper: Wrapper })
    result.current.mutate("p1")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(purchaseService.cancel).toHaveBeenCalledWith("p1")
  })
})
