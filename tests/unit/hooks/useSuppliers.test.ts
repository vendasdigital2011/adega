import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/SupplierService", () => ({
  supplierService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn() },
}))

import { supplierService } from "@/services/SupplierService"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useSetSupplierActive,
} from "@/features/suppliers/hooks/useSuppliers"

describe("useSuppliers hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useSuppliers chama supplierService.list", async () => {
    vi.mocked(supplierService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSuppliers({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supplierService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useCreateSupplier invalida a listagem", async () => {
    vi.mocked(supplierService.create).mockResolvedValue({ id: "1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateSupplier(), { wrapper: Wrapper })
    result.current.mutate({ name: "Distribuidora", document: "123", phone: "999" } as any)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] })
  })

  it("useUpdateSupplier repassa id e input", async () => {
    vi.mocked(supplierService.update).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUpdateSupplier(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", input: { name: "Novo Nome" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supplierService.update).toHaveBeenCalledWith("1", { name: "Novo Nome" })
  })

  it("useSetSupplierActive chama setActive", async () => {
    vi.mocked(supplierService.setActive).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSetSupplierActive(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", active: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supplierService.setActive).toHaveBeenCalledWith("1", true)
  })
})
