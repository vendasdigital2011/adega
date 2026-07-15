"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cashService, ListRegistersOptions } from "@/services/CashService"
import { CashMovementType } from "@/types"

export function useOpenRegister() {
  return useQuery({
    queryKey: ["cash-open-register"],
    queryFn: () => cashService.getOpenRegister(),
  })
}

export function useRegisters(options: ListRegistersOptions) {
  return useQuery({
    queryKey: ["cash-registers", options],
    queryFn: () => cashService.list(options),
  })
}

export function useRegisterMovements(cashRegisterId: string | null) {
  return useQuery({
    queryKey: ["cash-movements", cashRegisterId],
    queryFn: () => cashService.listMovements(cashRegisterId as string),
    enabled: !!cashRegisterId,
  })
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["cash-open-register"] })
  queryClient.invalidateQueries({ queryKey: ["cash-registers"] })
  queryClient.invalidateQueries({ queryKey: ["cash-movements"] })
}

export function useOpenCash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (initialValue: number) => cashService.open(initialValue),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useCloseCash() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, finalValue }: { id: string; finalValue: number }) => cashService.close(id, finalValue),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useRegisterCashMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      cashRegisterId,
      movementType,
      value,
      description,
    }: {
      cashRegisterId: string
      movementType: Extract<CashMovementType, "Sangria" | "Suprimento">
      value: number
      description?: string | null
    }) => cashService.registerMovement(cashRegisterId, movementType, value, description),
    onSuccess: () => invalidateAll(queryClient),
  })
}
