"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  supplierService,
  CreateSupplierInput,
  UpdateSupplierInput,
  ListSuppliersOptions,
} from "@/services/SupplierService"

export function useSuppliers(options: ListSuppliersOptions) {
  return useQuery({
    queryKey: ["suppliers", options],
    queryFn: () => supplierService.list(options),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => supplierService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      supplierService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

export function useSetSupplierActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      supplierService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}
