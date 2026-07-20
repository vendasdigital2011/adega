import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/InventoryService", () => ({
  inventoryService: { listMovements: vi.fn(), listLowStock: vi.fn(), registerMovement: vi.fn() },
}))
vi.mock("@/services/ProductService", () => ({
  productService: { list: vi.fn() },
}))

import { inventoryService } from "@/services/InventoryService"
import { productService } from "@/services/ProductService"
import { useMovements, useLowStock, useRegisterMovement } from "@/features/inventory/hooks/useInventory"
import { useActiveProducts } from "@/features/inventory/hooks/useActiveProducts"

describe("useInventory hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useMovements chama inventoryService.listMovements", async () => {
    vi.mocked(inventoryService.listMovements).mockResolvedValue({ data: [], total: 0 })
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useMovements({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(inventoryService.listMovements).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useLowStock chama inventoryService.listLowStock", async () => {
    vi.mocked(inventoryService.listLowStock).mockResolvedValue([])
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useLowStock(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("useRegisterMovement invalida estoque, produtos e opções relacionadas", async () => {
    vi.mocked(inventoryService.registerMovement).mockResolvedValue({ id: "m1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useRegisterMovement(), { wrapper: Wrapper })
    result.current.mutate({ product_id: "p1", movement_type: "Entrada", quantity: 10 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const keys = spy.mock.calls.map((c) => (c[0] as any).queryKey[0])
    expect(keys).toEqual(
      expect.arrayContaining(["inventory-movements", "inventory-low-stock", "inventory-active-products", "products", "product-options"])
    )
  })

  it("useActiveProducts retorna produtos ativos formatados", async () => {
    vi.mocked(productService.list).mockResolvedValue({ data: [{ id: "p1" }], total: 1 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useActiveProducts(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.products).toEqual([{ id: "p1" }])
    expect(productService.list).toHaveBeenCalledWith({ active: true, page: 1, limit: 1000 })
  })
})
