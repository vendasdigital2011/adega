"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  categoryService,
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesOptions,
} from "@/services/CategoryService"

export function useCategories(options: ListCategoriesOptions) {
  return useQuery({
    queryKey: ["categories", options],
    queryFn: () => categoryService.list(options),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoryService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useSetCategoryActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      categoryService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}
