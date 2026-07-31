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

// Vendas mexem no estoque, no caixa (Entrada/Saída automáticas) e, no caso de
// venda fiado, em contas a receber — invalida tudo isso também.
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["sales"] })
  queryClient.invalidateQueries({ queryKey: ["products"] })
  queryClient.invalidateQueries({ queryKey: ["product-options"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-active-products"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
  queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
  queryClient.invalidateQueries({ queryKey: ["cash-movements"] })
  queryClient.invalidateQueries({ queryKey: ["cash-open-register"] })
  queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] })
  queryClient.invalidateQueries({ queryKey: ["cash-flow"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
  queryClient.invalidateQueries({ queryKey: ["audit"] })
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
