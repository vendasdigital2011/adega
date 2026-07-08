"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { roleService, CreateRoleInput } from "@/services/RoleService"

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.list(),
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoleInput) => roleService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateRoleInput> }) =>
      roleService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
  })
}
