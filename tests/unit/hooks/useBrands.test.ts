import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/BrandService", () => ({
  brandService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn() },
}))

import { brandService } from "@/services/BrandService"
import { useBrands, useCreateBrand, useUpdateBrand, useSetBrandActive } from "@/features/brands/hooks/useBrands"

describe("useBrands hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useBrands chama brandService.list com as options", async () => {
    vi.mocked(brandService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useBrands({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(brandService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useCreateBrand invalida a listagem após criar", async () => {
    vi.mocked(brandService.create).mockResolvedValue({ id: "1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateBrand(), { wrapper: Wrapper })
    result.current.mutate({ name: "Heineken" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["brands"] })
  })

  it("useUpdateBrand repassa id e input", async () => {
    vi.mocked(brandService.update).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUpdateBrand(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", input: { name: "Nova" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(brandService.update).toHaveBeenCalledWith("1", { name: "Nova" })
  })

  it("useSetBrandActive chama setActive", async () => {
    vi.mocked(brandService.setActive).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSetBrandActive(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", active: false })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(brandService.setActive).toHaveBeenCalledWith("1", false)
  })
})
