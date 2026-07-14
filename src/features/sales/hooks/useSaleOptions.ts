"use client"

import { useQuery } from "@tanstack/react-query"
import { customerService } from "@/services/CustomerService"
import { useActiveProducts } from "@/features/inventory/hooks/useActiveProducts"

// Clientes ativos (para o select opcional) + produtos ativos (para os itens).
export function useSaleOptions() {
  const { products, isLoading: loadingProducts } = useActiveProducts()
  const customers = useQuery({
    queryKey: ["sale-options", "customers"],
    queryFn: () => customerService.list({ active: true, page: 1, limit: 1000 }),
  })

  return {
    customers: customers.data?.data ?? [],
    products,
    isLoading: loadingProducts || customers.isLoading,
  }
}
