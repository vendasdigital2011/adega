"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { payableSchema, PayableFormInputs } from "../schemas/financial.schema"
import { useFinancialOptions } from "../hooks/useFinancialOptions"

interface PayableFormProps {
  onSubmit: (data: PayableFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function PayableForm({ onSubmit, onCancel, isLoading }: PayableFormProps) {
  const { suppliers, costCenters, isLoading: loadingOptions } = useFinancialOptions()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayableFormInputs>({
    resolver: zodResolver(payableSchema),
    defaultValues: { supplier_id: "", cost_center_id: "", description: "", due_date: today(), amount: "" as unknown as number },
  })

  const supplierOptions = [
    { value: "", label: "— Despesa avulsa (sem fornecedor) —" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ]
  const costCenterOptions = [
    { value: "", label: "— Sem centro de custo —" },
    ...costCenters.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Fornecedor (opcional)"
        options={supplierOptions}
        error={errors.supplier_id?.message}
        disabled={loadingOptions}
        {...register("supplier_id")}
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
