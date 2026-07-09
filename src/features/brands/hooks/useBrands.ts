"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  brandService,
  CreateBrandInput,
  UpdateBrandInput,
  ListBrandsOptions,
} from "@/services/BrandService"

export function useBrands(options: ListBrandsOptions) {
  return useQuery({
    queryKey: ["brands", options],
    queryFn: () => brandService.list(options),
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBrandInput) => brandService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBrandInput }) =>
      brandService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}

export function useSetBrandActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      brandService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] })
    },
  })
}
