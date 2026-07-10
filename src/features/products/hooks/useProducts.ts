"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  productService,
  CreateProductInput,
  UpdateProductInput,
  ListProductsOptions,
} from "@/services/ProductService"

export function useProducts(options: ListProductsOptions) {
  return useQuery({
    queryKey: ["products", options],
    queryFn: () => productService.list(options),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) => productService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useSetProductActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      productService.setActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}
