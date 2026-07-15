"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/utils/format"
import { closeCashSchema, CloseCashFormInputs } from "../schemas/cash.schema"

interface CloseCashFormProps {
  expectedBalance: number
  onSubmit: (data: CloseCashFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CloseCashForm({ expectedBalance, onSubmit, onCancel, isLoading }: CloseCashFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CloseCashFormInputs>({
    resolver: zodResolver(closeCashSchema),
    defaultValues: { final_value: "" as unknown as number },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Saldo esperado pelo sistema: <span className="font-semibold text-foreground">{formatCurrency(expectedBalance)}</span>
      </p>
      <Input
        label="Valor contado no caixa (fechamento físico)"
        type="number"
        step="0.01"
        error={errors.final_value?.message}
        {...register("final_value")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" variant="danger" loading={isLoading}>
          Fechar Caixa
        </Button>
      </div>
    </form>
  )
}
