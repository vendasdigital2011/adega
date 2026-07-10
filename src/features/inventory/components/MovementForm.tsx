"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { movementSchema, MovementFormInputs, MOVEMENT_TYPES } from "../schemas/movement.schema"
import { useActiveProducts } from "../hooks/useActiveProducts"

interface MovementFormProps {
  onSubmit: (data: MovementFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const TYPE_HINTS: Record<string, string> = {
  Entrada: "Adiciona a quantidade informada ao estoque.",
  Saída: "Remove a quantidade informada do estoque.",
  Ajuste: "Correção manual. Use valor negativo para reduzir (ex: -3).",
  Inventário: "Define o saldo absoluto contado (substitui o atual).",
  Perda: "Remove do estoque por perda.",
  Quebra: "Remove do estoque por quebra/avaria.",
}

export function MovementForm({ onSubmit, onCancel, isLoading }: MovementFormProps) {
  const { products, isLoading: loadingProducts } = useActiveProducts()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovementFormInputs>({
    resolver: zodResolver(movementSchema),
    defaultValues: { product_id: "", movement_type: "Entrada", quantity: "" as unknown as number, reference: "", observation: "" },
  })

  const selectedType = watch("movement_type")
  const selectedProductId = watch("product_id")
  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const productOptions = [
    { value: "", label: "Selecione um produto..." },
    ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku}) — saldo ${p.current_stock}` })),
  ]
  const typeOptions = MOVEMENT_TYPES.map((t) => ({ value: t, label: t }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Produto"
        options={productOptions}
        error={errors.product_id?.message}
        disabled={loadingProducts}
        {...register("product_id")}
      />
      {selectedProduct && (
        <p className="text-xs text-muted-foreground -mt-2">
          Saldo atual: <span className="font-medium text-foreground">{selectedProduct.current_stock}</span>
          {" · "}Estoque mínimo: {selectedProduct.minimum_stock}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Tipo de movimentação" options={typeOptions} error={errors.movement_type?.message} {...register("movement_type")} />
        <Input label="Quantidade" type="number" step="1" error={errors.quantity?.message} {...register("quantity")} />
      </div>
      {selectedType && <p className="text-xs text-muted-foreground -mt-2">{TYPE_HINTS[selectedType]}</p>}

      <Input label="Referência (opcional)" placeholder="Ex: NF 1234, ordem interna..." error={errors.reference?.message} {...register("reference")} />
      <Textarea label="Observação (opcional)" error={errors.observation?.message} {...register("observation")} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Registrar Movimentação
        </Button>
      </div>
    </form>
  )
}
