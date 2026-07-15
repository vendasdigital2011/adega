"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { movementSchema, MovementFormInputs } from "../schemas/cash.schema"

interface CashMovementFormProps {
  onSubmit: (data: MovementFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CashMovementForm({ onSubmit, onCancel, isLoading }: CashMovementFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MovementFormInputs>({
    resolver: zodResolver(movementSchema),
    defaultValues: { movement_type: "Sangria", value: "" as unknown as number, description: "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Tipo"
        options={[
          { value: "Sangria", label: "Sangria (retirada)" },
          { value: "Suprimento", label: "Suprimento (reforço)" },
        ]}
        error={errors.movement_type?.message}
        {...register("movement_type")}
      />
      <Input label="Valor" type="number" step="0.01" error={errors.value?.message} {...register("value")} />
      <Input label="Descrição (opcional)" error={errors.description?.message} {...register("description")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Registrar
        </Button>
      </div>
    </form>
  )
}
