"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/utils/format"
import { settleSchema, SettleFormInputs } from "../schemas/financial.schema"

interface SettleFormProps {
  outstanding: number
  onSubmit: (data: SettleFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
  submitLabel: string
}

export function SettleForm({ outstanding, onSubmit, onCancel, isLoading, submitLabel }: SettleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettleFormInputs>({
    resolver: zodResolver(settleSchema),
    defaultValues: { value: outstanding as unknown as number, description: "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Saldo em aberto: <span className="font-semibold text-foreground">{formatCurrency(outstanding)}</span>
      </p>
      <Input label="Valor" type="number" step="0.01" error={errors.value?.message} {...register("value")} />
      <Input label="Descrição (opcional)" error={errors.description?.message} {...register("description")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
