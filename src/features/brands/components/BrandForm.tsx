"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { brandSchema, BrandFormInputs } from "../schemas/brand.schema"
import { Brand } from "@/types"

interface BrandFormProps {
  brand?: Brand
  onSubmit: (data: BrandFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function BrandForm({ brand, onSubmit, onCancel, isLoading }: BrandFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandFormInputs>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: brand?.name || "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome da marca" error={errors.name?.message} {...register("name")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          {brand ? "Salvar" : "Criar Marca"}
        </Button>
      </div>
    </form>
  )
}
