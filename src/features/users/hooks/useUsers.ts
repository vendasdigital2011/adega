"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  userService,
  CreateUserInput,
  UpdateUserInput,
  ListUsersOptions,
} from "@/services/UserService"

export function useUsers(options: ListUsersOptions) {
  return useQuery({
    queryKey: ["users", options],
    queryFn: () => userService.list(options),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => userService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      userService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}
