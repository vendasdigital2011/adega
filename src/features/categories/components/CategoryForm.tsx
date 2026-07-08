"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { categorySchema, CategoryFormInputs } from "../schemas/category.schema"
import { Category } from "@/types"

interface CategoryFormProps {
  category?: Category
  onSubmit: (data: CategoryFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormInputs>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome da categoria" error={errors.name?.message} {...register("name")} />
      <Textarea label="Descrição (opcional)" error={errors.description?.message} {...register("description")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          {category ? "Salvar" : "Criar Categoria"}
        </Button>
      </div>
    </form>
  )
}
