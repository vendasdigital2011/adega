"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  purchaseService,
  CreatePurchaseInput,
  ListPurchasesOptions,
} from "@/services/PurchaseService"

export function usePurchases(options: ListPurchasesOptions) {
  return useQuery({
    queryKey: ["purchases", options],
    queryFn: () => purchaseService.list(options),
  })
}

export function usePurchaseItems(purchaseId: string | null) {
  return useQuery({
    queryKey: ["purchase-items", purchaseId],
    queryFn: () => purchaseService.getItems(purchaseId as string),
    enabled: !!purchaseId,
  })
}

// Após receber/cancelar, o estoque muda — invalida também produtos e movimentos.
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["purchases"] })
  queryClient.invalidateQueries({ queryKey: ["products"] })
  queryClient.invalidateQueries({ queryKey: ["product-options"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-active-products"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePurchaseInput) => purchaseService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchases"] }),
  })
}

export function useReceivePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseService.receive(id),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useCancelPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchaseService.cancel(id),
    onSuccess: () => invalidateAll(queryClient),
  })
}
