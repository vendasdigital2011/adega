"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { openCashSchema, OpenCashFormInputs } from "../schemas/cash.schema"

interface OpenCashFormProps {
  onSubmit: (data: OpenCashFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function OpenCashForm({ onSubmit, onCancel, isLoading }: OpenCashFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OpenCashFormInputs>({
    resolver: zodResolver(openCashSchema),
    defaultValues: { initial_value: "" as unknown as number },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Valor inicial (fundo de troco)"
        type="number"
        step="0.01"
        error={errors.initial_value?.message}
        {...register("initial_value")}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Abrir Caixa
        </Button>
      </div>
    </form>
  )
}
