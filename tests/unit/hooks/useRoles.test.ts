import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/RoleService", () => ({
  roleService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}))

import { roleService } from "@/services/RoleService"
import { useRoles, useCreateRole, useUpdateRole } from "@/features/users/hooks/useRoles"

describe("useRoles hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useRoles chama roleService.list", async () => {
    vi.mocked(roleService.list).mockResolvedValue([{ id: "r1", name: "Administrador" }] as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useRoles(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(roleService.list).toHaveBeenCalled()
  })

  it("useCreateRole / useUpdateRole invalidam roles", async () => {
    vi.mocked(roleService.create).mockResolvedValue({ id: "r2" } as any)
    vi.mocked(roleService.update).mockResolvedValue({ id: "r2" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")

    const { result: create } = renderHook(() => useCreateRole(), { wrapper: Wrapper })
    create.current.mutate({ name: "Novo Perfil" })
    await waitFor(() => expect(create.current.isSuccess).toBe(true))

    const { result: update } = renderHook(() => useUpdateRole(), { wrapper: Wrapper })
    update.current.mutate({ id: "r2", input: { description: "editado" } })
    await waitFor(() => expect(update.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["roles"] })
  })
})
