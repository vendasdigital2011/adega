import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CustomerService", () => ({
  customerService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn() },
}))

import { customerService } from "@/services/CustomerService"
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useSetCustomerActive,
} from "@/features/customers/hooks/useCustomers"

describe("useCustomers hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useCustomers chama customerService.list", async () => {
    vi.mocked(customerService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCustomers({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(customerService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useCreateCustomer invalida a listagem", async () => {
    vi.mocked(customerService.create).mockResolvedValue({ id: "1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateCustomer(), { wrapper: Wrapper })
    result.current.mutate({ name: "Maria" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] })
  })

  it("useUpdateCustomer repassa id e input", async () => {
    vi.mocked(customerService.update).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUpdateCustomer(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", input: { name: "Maria Editada" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(customerService.update).toHaveBeenCalledWith("1", { name: "Maria Editada" })
  })

  it("useSetCustomerActive chama setActive", async () => {
    vi.mocked(customerService.setActive).mockResolvedValue({ id: "1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSetCustomerActive(), { wrapper: Wrapper })
    result.current.mutate({ id: "1", active: false })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(customerService.setActive).toHaveBeenCalledWith("1", false)
  })
})
