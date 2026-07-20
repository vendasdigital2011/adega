import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/NotificationService", () => ({
  notificationService: {
    generate: vi.fn(),
    list: vi.fn(),
    unreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}))

import { notificationService } from "@/services/NotificationService"
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/notifications/hooks/useNotifications"

describe("useNotifications hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useNotifications gera alertas e depois lista + conta não lidas", async () => {
    vi.mocked(notificationService.generate).mockResolvedValue(undefined)
    vi.mocked(notificationService.list).mockResolvedValue([{ id: "n1", read: false }] as any)
    vi.mocked(notificationService.unreadCount).mockResolvedValue(1)

    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useNotifications(10), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationService.generate).toHaveBeenCalled()
    expect(notificationService.list).toHaveBeenCalledWith(10)
    expect(result.current.data).toEqual({ data: [{ id: "n1", read: false }], unreadCount: 1 })
  })

  it("useMarkNotificationRead invalida notifications", async () => {
    vi.mocked(notificationService.markAsRead).mockResolvedValue(undefined)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper })
    result.current.mutate("n1")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationService.markAsRead).toHaveBeenCalledWith("n1")
    expect(spy).toHaveBeenCalledWith({ queryKey: ["notifications"] })
  })

  it("useMarkAllNotificationsRead chama markAllAsRead", async () => {
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue(undefined)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper: Wrapper })
    result.current.mutate()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationService.markAllAsRead).toHaveBeenCalled()
  })
})
