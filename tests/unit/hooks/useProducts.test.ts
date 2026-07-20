import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/ProductService", () => ({
  productService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn() },
}))

import { productService } from "@/services/ProductService"
import { useProducts, useCreateProduct, useUpdateProduct, useSetProductActive } from "@/features/products/hooks/useProducts"

describe("useProducts hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useProducts chama productService.list", async () => {
    vi.mocked(productService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useProducts({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(productService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useCreateProduct invalida a listagem", async () => {
    vi.mocked(productService.create).mockResolvedValue({ id: "1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateProduct(), { wrapper: Wrapper })
    result.current.mutate({ name: "Vinho", sku: "V1", category_id: "c1", sale_price: 10, minimum_stock: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] })
  })

  it("useUpdateProduct repassa id e input", async () => {
    vi.mocked(productService.update).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", input: { name: "Vinho Editado" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(productService.update).toHaveBeenCalledWith("1", { name: "Vinho Editado" })
  })

  it("useSetProductActive chama setActive", async () => {
    vi.mocked(productService.setActive).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSetProductActive(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", active: false })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(productService.setActive).toHaveBeenCalledWith("1", false)
  })
})
