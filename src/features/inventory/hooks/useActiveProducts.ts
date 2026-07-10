"use client"

import { useQuery } from "@tanstack/react-query"
import { productService } from "@/services/ProductService"

// Produtos ativos para alimentar o select de movimentação de estoque.
export function useActiveProducts() {
  const query = useQuery({
    queryKey: ["inventory-active-products"],
    queryFn: () => productService.list({ active: true, page: 1, limit: 1000 }),
  })
  return {
    products: query.data?.data ?? [],
    isLoading: query.isLoading,
  }
}
