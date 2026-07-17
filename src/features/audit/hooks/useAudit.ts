"use client"

import { useQuery } from "@tanstack/react-query"
import { auditService, ListAuditOptions } from "@/services/AuditService"

export function useAuditLogs(options: ListAuditOptions) {
  return useQuery({
    queryKey: ["audit-logs", options],
    queryFn: () => auditService.list(options),
  })
}

export function useAuditUsers() {
  return useQuery({
    queryKey: ["audit-users"],
    queryFn: () => auditService.listUsers(),
  })
}
