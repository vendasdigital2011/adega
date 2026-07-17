"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "@/services/NotificationService"

const POLL_INTERVAL_MS = 60_000

export function useNotifications(limit = 15) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: async () => {
      await notificationService.generate()
      const [data, unreadCount] = await Promise.all([
        notificationService.list(limit),
        notificationService.unreadCount(),
      ])
      return { data, unreadCount }
    },
    refetchInterval: POLL_INTERVAL_MS,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}
