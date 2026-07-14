"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { saleService, CreateSaleInput, ListSalesOptions } from "@/services/SaleService"

export function useSales(options: ListSalesOptions) {
  return useQuery({
    queryKey: ["sales", options],
    queryFn: () => saleService.list(options),
  })
}

export function useSaleItems(saleId: string | null) {
  return useQuery({
    queryKey: ["sale-items", saleId],
    queryFn: () => saleService.getItems(saleId as string),
    enabled: !!saleId,
  })
}

// Vendas mexem no estoque — invalida produtos e movimentos também.
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["sales"] })
  queryClient.invalidateQueries({ queryKey: ["products"] })
  queryClient.invalidateQueries({ queryKey: ["product-options"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-active-products"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSaleInput) => saleService.create(input),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => saleService.cancel(id),
    onSuccess: () => invalidateAll(queryClient),
  })
}
