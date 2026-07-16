"use client"

import { useQuery } from "@tanstack/react-query"
import { customerService } from "@/services/CustomerService"
import { supplierService } from "@/services/SupplierService"
import { useActiveCostCenters } from "./useFinancial"

// Clientes/fornecedores ativos (para os selects opcionais dos lançamentos manuais).
export function useFinancialOptions() {
  const costCenters = useActiveCostCenters()
  const customers = useQuery({
    queryKey: ["financial-options", "customers"],
    queryFn: () => customerService.list({ active: true, page: 1, limit: 1000 }),
  })
  const suppliers = useQuery({
    queryKey: ["financial-options", "suppliers"],
    queryFn: () => supplierService.list({ active: true, page: 1, limit: 1000 }),
  })

  return {
    customers: customers.data?.data ?? [],
    suppliers: suppliers.data?.data ?? [],
    costCenters: costCenters.data ?? [],
    isLoading: customers.isLoading || suppliers.isLoading || costCenters.isLoading,
  }
}
