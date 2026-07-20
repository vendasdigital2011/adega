import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CategoryService", () => ({ categoryService: { list: vi.fn() } }))
vi.mock("@/services/BrandService", () => ({ brandService: { list: vi.fn() } }))
vi.mock("@/services/SupplierService", () => ({ supplierService: { list: vi.fn() } }))

import { categoryService } from "@/services/CategoryService"
import { brandService } from "@/services/BrandService"
import { supplierService } from "@/services/SupplierService"
import { useProductOptions } from "@/features/products/hooks/useProductOptions"

describe("useProductOptions", () => {
  beforeEach(() => vi.clearAllMocks())

  it("agrega categorias, marcas e fornecedores ativos", async () => {
    vi.mocked(categoryService.list).mockResolvedValue({ data: [{ id: "c1" }], total: 1 } as any)
    vi.mocked(brandService.list).mockResolvedValue({ data: [{ id: "b1" }], total: 1 } as any)
    vi.mocked(supplierService.list).mockResolvedValue({ data: [{ id: "s1" }], total: 1 } as any)

    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useProductOptions(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.categories).toEqual([{ id: "c1" }])
    expect(result.current.brands).toEqual([{ id: "b1" }])
    expect(result.current.suppliers).toEqual([{ id: "s1" }])
    expect(categoryService.list).toHaveBeenCalledWith({ active: true, page: 1, limit: 1000 })
  })
})
