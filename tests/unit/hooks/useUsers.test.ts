import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/UserService", () => ({
  userService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

import { userService } from "@/services/UserService"
import { useUsers, useCreateUser, useUpdateUser } from "@/features/users/hooks/useUsers"

describe("useUsers hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useUsers chama userService.list com as options", async () => {
    vi.mocked(userService.list).mockResolvedValue({ data: [], total: 0 })
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUsers({ page: 1, limit: 20 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(userService.list).toHaveBeenCalledWith({ page: 1, limit: 20 })
  })

  it("useCreateUser invalida users após criar", async () => {
    vi.mocked(userService.create).mockResolvedValue({ id: "u1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateUser(), { wrapper: Wrapper })
    result.current.mutate({ name: "Novo", email: "novo@teste.com", password: "senha1234", role_id: "r1" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] })
  })

  it("useUpdateUser repassa id e input", async () => {
    vi.mocked(userService.update).mockResolvedValue({ id: "u1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useUpdateUser(), { wrapper: Wrapper })
    result.current.mutate({ id: "u1", input: { name: "Editado", role_id: "r1" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(userService.update).toHaveBeenCalledWith("u1", { name: "Editado", role_id: "r1" })
  })
})
