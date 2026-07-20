import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CategoryService", () => ({
  categoryService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setActive: vi.fn(),
  },
}))

import { categoryService } from "@/services/CategoryService"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useSetCategoryActive,
} from "@/features/categories/hooks/useCategories"

describe("useCategories hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("useCategories chama categoryService.list com as options recebidas", async () => {
    const result = { data: [{ id: "1", name: "Vinhos" }], total: 1 }
    vi.mocked(categoryService.list).mockResolvedValue(result as any)

    const { Wrapper } = createQueryWrapper()
    const { result: hookResult } = renderHook(() => useCategories({ page: 1, limit: 10 }), { wrapper: Wrapper })

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true))
    expect(categoryService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
    expect(hookResult.current.data).toEqual(result)
  })

  it("useCreateCategory chama categoryService.create e invalida a query de listagem", async () => {
    vi.mocked(categoryService.create).mockResolvedValue({ id: "1", name: "Nova" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper })
    result.current.mutate({ name: "Nova" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(categoryService.create).toHaveBeenCalledWith({ name: "Nova" })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categories"] })
  })

  it("useUpdateCategory repassa id e input pro service", async () => {
    vi.mocked(categoryService.update).mockResolvedValue({ id: "1", name: "Editada" } as any)
    const { Wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useUpdateCategory(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", input: { name: "Editada" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(categoryService.update).toHaveBeenCalledWith("1", { name: "Editada" })
  })

  it("useSetCategoryActive chama setActive com o id e o novo estado", async () => {
    vi.mocked(categoryService.setActive).mockResolvedValue({ id: "1", active: false } as any)
    const { Wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useSetCategoryActive(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", active: false })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(categoryService.setActive).toHaveBeenCalledWith("1", false)
  })

  it("propaga o erro do service quando a criação falha (ex.: nome duplicado)", async () => {
    vi.mocked(categoryService.create).mockRejectedValue({ code: "DUPLICATE_NAME", message: "Já existe." })
    const { Wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useCreateCategory(), { wrapper: Wrapper })
    result.current.mutate({ name: "Repetida" })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as any).code).toBe("DUPLICATE_NAME")
  })
})
