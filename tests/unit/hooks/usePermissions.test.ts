import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/PermissionService", () => ({
  permissionService: { listAll: vi.fn(), listForRole: vi.fn(), grant: vi.fn(), revoke: vi.fn() },
}))

import { permissionService } from "@/services/PermissionService"
import { useAllPermissions, useRolePermissions, useTogglePermission } from "@/features/users/hooks/usePermissions"

describe("usePermissions hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useAllPermissions chama listAll", async () => {
    vi.mocked(permissionService.listAll).mockResolvedValue([{ id: "p1", name: "categories.view" }] as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useAllPermissions(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it("useRolePermissions fica idle sem roleId", () => {
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useRolePermissions(null), { wrapper: Wrapper })
    expect(permissionService.listForRole).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("useTogglePermission chama grant quando grant=true e revoke quando grant=false", async () => {
    vi.mocked(permissionService.grant).mockResolvedValue(undefined)
    vi.mocked(permissionService.revoke).mockResolvedValue(undefined)
    const { Wrapper } = createQueryWrapper()

    const { result } = renderHook(() => useTogglePermission("r1"), { wrapper: Wrapper })
    result.current.mutate({ permissionId: "p1", grant: true })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(permissionService.grant).toHaveBeenCalledWith("r1", "p1")

    result.current.mutate({ permissionId: "p1", grant: false })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(permissionService.revoke).toHaveBeenCalledWith("r1", "p1")
  })
})
