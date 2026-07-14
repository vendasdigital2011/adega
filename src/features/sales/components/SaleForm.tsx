"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/utils/format"
import { saleSchema, SaleFormInputs, PAYMENT_METHODS } from "../schemas/sale.schema"
import { useSaleOptions } from "../hooks/useSaleOptions"
import { Plus, Trash2 } from "lucide-react"

interface SaleFormProps {
  onSubmit: (data: SaleFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function SaleForm({ onSubmit, onCancel, isLoading }: SaleFormProps) {
  const { customers, products, isLoading: loadingOptions } = useSaleOptions()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SaleFormInputs>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customer_id: "",
      sale_date: today(),
      payment_method: "Dinheiro",
      discount: "" as unknown as number,
      items: [{ product_id: "", quantity: "" as unknown as number, unit_price: "" as unknown as number }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const customerOptions = [
    { value: "", label: "— Sem cliente (balcão) —" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ]
  const productOptions = [
    { value: "", label: "Selecione..." },
    ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku}) — ${formatCurrency(p.sale_price)} · saldo ${p.current_stock}` })),
  ]
  const paymentOptions = PAYMENT_METHODS.map((m) => ({ value: m, label: m }))

  const watchedItems = watch("items")
  const watchedDiscount = Number(watch("discount")) || 0
  const subtotal = (watchedItems || []).reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unit_price) || 0),
    0
  )
  const total = Math.max(0, subtotal - watchedDiscount)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Cliente (opcional)"
          options={customerOptions}
          error={errors.customer_id?.message}
          disabled={loadingOptions}
          {...register("customer_id")}
        />
        <Select label="Forma de pagamento" options={paymentOptions} error={errors.payment_method?.message} {...register("payment_method")} />
        <Input label="Data" type="date" error={errors.sale_date?.message} {...register("sale_date")} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground/80">Itens</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ product_id: "", quantity: "" as unknown as number, unit_price: "" as unknown as number })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar item
          </Button>
        </div>
        {errors.items?.message && <p className="text-xs text-destructive mb-2">{errors.items.message}</p>}

        <div className="space-y-2">
          {fields.map((field, index) => {
            const qty = Number(watchedItems?.[index]?.quantity) || 0
            const price = Number(watchedItems?.[index]?.unit_price) || 0
            return (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <Select
                    options={productOptions}
                    error={errors.items?.[index]?.product_id?.message}
                    disabled={loadingOptions}
                    {...register(`items.${index}.product_id` as const)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    step="1"
                    placeholder="Qtd."
                    error={errors.items?.[index]?.quantity?.message}
                    {...register(`items.${index}.quantity` as const)}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Preço un."
                    error={errors.items?.[index]?.unit_price?.message}
                    {...register(`items.${index}.unit_price` as const)}
                  />
                </div>
                <div className="w-24 pt-2 text-sm text-muted-foreground text-right whitespace-nowrap">
                  {formatCurrency(qty * price)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Desconto (opcional)" type="number" step="0.01" error={errors.discount?.message} {...register("discount")} />
        <div className="flex flex-col justify-end">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-1 mt-1">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          Finalizar Venda
        </Button>
      </div>
    </form>
  )
}
