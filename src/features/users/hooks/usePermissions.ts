"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { permissionService } from "@/services/PermissionService"

export function useAllPermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionService.listAll(),
  })
}

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: () => permissionService.listForRole(roleId as string),
    enabled: !!roleId,
  })
}

export function useTogglePermission(roleId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ permissionId, grant }: { permissionId: string; grant: boolean }) =>
      grant
        ? permissionService.grant(roleId as string, permissionId)
        : permissionService.revoke(roleId as string, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions", roleId] })
    },
  })
}
