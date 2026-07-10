"use client"

import { useQuery } from "@tanstack/react-query"
import { categoryService } from "@/services/CategoryService"
import { brandService } from "@/services/BrandService"
import { supplierService } from "@/services/SupplierService"

// Carrega apenas registros ativos para alimentar os selects do formulário de
// produto. Categorias inativas não devem ser usadas em novos produtos (regra
// de negócio), e o mesmo critério é aplicado a marcas e fornecedores.
export function useProductOptions() {
  const categories = useQuery({
    queryKey: ["product-options", "categories"],
    queryFn: () => categoryService.list({ active: true, page: 1, limit: 1000 }),
  })
  const brands = useQuery({
    queryKey: ["product-options", "brands"],
    queryFn: () => brandService.list({ active: true, page: 1, limit: 1000 }),
  })
  const suppliers = useQuery({
    queryKey: ["product-options", "suppliers"],
    queryFn: () => supplierService.list({ active: true, page: 1, limit: 1000 }),
  })

  return {
    categories: categories.data?.data ?? [],
    brands: brands.data?.data ?? [],
    suppliers: suppliers.data?.data ?? [],
    isLoading: categories.isLoading || brands.isLoading || suppliers.isLoading,
  }
}
