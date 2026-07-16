"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { receivableSchema, ReceivableFormInputs } from "../schemas/financial.schema"
import { useFinancialOptions } from "../hooks/useFinancialOptions"

interface ReceivableFormProps {
  onSubmit: (data: ReceivableFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function ReceivableForm({ onSubmit, onCancel, isLoading }: ReceivableFormProps) {
  const { customers, costCenters, isLoading: loadingOptions } = useFinancialOptions()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceivableFormInputs>({
    resolver: zodResolver(receivableSchema),
    defaultValues: { customer_id: "", cost_center_id: "", description: "", due_date: today(), amount: "" as unknown as number },
  })

  const customerOptions = [
    { value: "", label: "— Receita avulsa (sem cliente) —" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ]
  const costCenterOptions = [
    { value: "", label: "— Sem centro de custo —" },
    ...costCenters.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Cliente (opcional)"
        options={customerOptions}
        error={errors.customer_id?.message}
        disabled={loadingOptions}
        {...register("customer_id")}
      />
      <Select
        label="Centro de custo (opcional)"
        options={costCenterOptions}
        error={errors.cost_center_id?.message}
        disabled={loadingOptions}
        {...register("cost_center_id")}
      />
      <Input label="Descrição" error={errors.description?.message} {...register("description")} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Vencimento" type="date" error={errors.due_date?.message} {...register("due_date")} />
        <Input label="Valor" type="number" step="0.01" error={errors.amount?.message} {...register("amount")} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Lançar
        </Button>
      </div>
    </form>
  )
}
