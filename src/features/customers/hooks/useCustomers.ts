"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  customerService,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersOptions,
} from "@/services/CustomerService"

export function useCustomers(options: ListCustomersOptions) {
  return useQuery({
    queryKey: ["customers", options],
    queryFn: () => customerService.list(options),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customerService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      customerService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useSetCustomerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      customerService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}
