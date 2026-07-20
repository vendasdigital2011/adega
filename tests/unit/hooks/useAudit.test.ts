import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/AuditService", () => ({
  auditService: { list: vi.fn(), listUsers: vi.fn() },
}))

import { auditService } from "@/services/AuditService"
import { useAuditLogs, useAuditUsers } from "@/features/audit/hooks/useAudit"

describe("useAudit hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useAuditLogs chama auditService.list com as options", async () => {
    vi.mocked(auditService.list).mockResolvedValue({ data: [], total: 0 })
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useAuditLogs({ page: 1, limit: 20 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(auditService.list).toHaveBeenCalledWith({ page: 1, limit: 20 })
  })

  it("useAuditUsers chama auditService.listUsers", async () => {
    vi.mocked(auditService.listUsers).mockResolvedValue([{ id: "u1", name: "Admin" }])
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useAuditUsers(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: "u1", name: "Admin" }])
  })
})
