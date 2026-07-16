"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { settingsService, UpdateCompanyInput, UpsertSettingsInput } from "@/services/SettingsService"

export function useCompany() {
  return useQuery({
    queryKey: ["settings-company"],
    queryFn: () => settingsService.getCompany(),
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => settingsService.updateCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-company"] })
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsService.getSettings(),
  })
}

export function useUpsertSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertSettingsInput) => settingsService.upsertSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
    },
  })
}

export function useExportBackup() {
  return useMutation({
    mutationFn: () => settingsService.exportBackup(),
  })
}
