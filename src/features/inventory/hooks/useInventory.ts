"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  inventoryService,
  RegisterMovementInput,
  ListMovementsOptions,
} from "@/services/InventoryService"

export function useMovements(options: ListMovementsOptions) {
  return useQuery({
    queryKey: ["inventory-movements", options],
    queryFn: () => inventoryService.listMovements(options),
  })
}

export function useLowStock() {
  return useQuery({
    queryKey: ["inventory-low-stock"],
    queryFn: () => inventoryService.listLowStock(),
  })
}

export function useRegisterMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterMovementInput) => inventoryService.registerMovement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock"] })
      // O saldo do produto mudou — atualiza também as listas de produtos e o
      // select de produtos do próprio formulário de movimentação.
      queryClient.invalidateQueries({ queryKey: ["inventory-active-products"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product-options"] })
    },
  })
}
