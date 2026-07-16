"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { costCenterSchema, CostCenterFormInputs } from "../schemas/financial.schema"

interface CostCenterFormProps {
  onSubmit: (data: CostCenterFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CostCenterForm({ onSubmit, onCancel, isLoading }: CostCenterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CostCenterFormInputs>({
    resolver: zodResolver(costCenterSchema),
    defaultValues: { name: "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome do centro de custo" error={errors.name?.message} {...register("name")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Criar
        </Button>
      </div>
    </form>
  )
}
