"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { costCenterService, ListCostCentersOptions } from "@/services/CostCenterService"
import {
  accountsReceivableService,
  CreateReceivableInput,
  ListReceivablesOptions,
} from "@/services/AccountsReceivableService"
import { accountsPayableService, CreatePayableInput, ListPayablesOptions } from "@/services/AccountsPayableService"
import { financialService } from "@/services/FinancialService"

// ---------- Centros de custo ----------
export function useCostCenters(options: ListCostCentersOptions) {
  return useQuery({
    queryKey: ["cost-centers", options],
    queryFn: () => costCenterService.list(options),
  })
}

export function useActiveCostCenters() {
  return useQuery({
    queryKey: ["cost-centers-active"],
    queryFn: () => costCenterService.listActive(),
  })
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) => costCenterService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] })
      queryClient.invalidateQueries({ queryKey: ["cost-centers-active"] })
    },
  })
}

export function useSetCostCenterActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => costCenterService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] })
      queryClient.invalidateQueries({ queryKey: ["cost-centers-active"] })
    },
  })
}

// ---------- Contas a receber ----------
export function useReceivables(options: ListReceivablesOptions) {
  return useQuery({
    queryKey: ["accounts-receivable", options],
    queryFn: () => accountsReceivableService.list(options),
  })
}

export function useReceivableReceipts(accountsReceivableId: string | null) {
  return useQuery({
    queryKey: ["receivable-receipts", accountsReceivableId],
    queryFn: () => accountsReceivableService.listReceipts(accountsReceivableId as string),
    enabled: !!accountsReceivableId,
  })
}

function invalidateReceivables(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["accounts-receivable"] })
  queryClient.invalidateQueries({ queryKey: ["receivable-receipts"] })
  queryClient.invalidateQueries({ queryKey: ["cash-flow"] })
}

export function useCreateReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReceivableInput) => accountsReceivableService.create(input),
    onSuccess: () => invalidateReceivables(queryClient),
  })
}

export function useRegisterReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, value, description }: { id: string; value: number; description?: string | null }) =>
      accountsReceivableService.registerReceipt(id, value, description),
    onSuccess: () => invalidateReceivables(queryClient),
  })
}

export function useCancelReceivable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountsReceivableService.cancel(id),
    onSuccess: () => invalidateReceivables(queryClient),
  })
}

// ---------- Contas a pagar ----------
export function usePayables(options: ListPayablesOptions) {
  return useQuery({
    queryKey: ["accounts-payable", options],
    queryFn: () => accountsPayableService.list(options),
  })
}

export function usePayablePayments(accountsPayableId: string | null) {
  return useQuery({
    queryKey: ["payable-payments", accountsPayableId],
    queryFn: () => accountsPayableService.listPayments(accountsPayableId as string),
    enabled: !!accountsPayableId,
  })
}

function invalidatePayables(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["accounts-payable"] })
  queryClient.invalidateQueries({ queryKey: ["payable-payments"] })
  queryClient.invalidateQueries({ queryKey: ["cash-flow"] })
}

export function useCreatePayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePayableInput) => accountsPayableService.create(input),
    onSuccess: () => invalidatePayables(queryClient),
  })
}

export function useRegisterPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, value, description }: { id: string; value: number; description?: string | null }) =>
      accountsPayableService.registerPayment(id, value, description),
    onSuccess: () => invalidatePayables(queryClient),
  })
}

export function useCancelPayable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountsPayableService.cancel(id),
    onSuccess: () => invalidatePayables(queryClient),
  })
}

// ---------- Fluxo de caixa ----------
export function useCashFlow(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["cash-flow", startDate, endDate],
    queryFn: () => financialService.getCashFlow(startDate, endDate),
  })
}
