"use client"

import { useRef, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/utils/format"
import { saleSchema, SaleFormInputs, PAYMENT_METHODS } from "../schemas/sale.schema"
import { useSaleOptions } from "../hooks/useSaleOptions"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { Plus, Trash2 } from "lucide-react"

interface SaleFormProps {
  onSubmit: (data: SaleFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// Atalhos do PDV (auditoria "reviravolta", Etapa 6 / Seção 25 — escopo
// reduzido pra tela de Vendas, onde o ganho de velocidade é real):
// F6 foca o código de barras, F8 o desconto, F9 a forma de pagamento,
// F10 finaliza a venda. Delete/+/- agem na linha de item com foco (ver
// inputs de quantidade abaixo) — não são atalhos globais, são
// onKeyDown locais, então funcionam exatamente onde o operador está.
export function SaleForm({ onSubmit, onCancel, isLoading }: SaleFormProps) {
  const { customers, products, isLoading: loadingOptions } = useSaleOptions()
  const [barcodeValue, setBarcodeValue] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SaleFormInputs>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customer_id: "",
      sale_date: today(),
      payment_method: "Dinheiro",
      discount: "" as unknown as number,
      items: [{ product_id: "", quantity: "" as unknown as number }],
    },
  })

  const { fields, append, remove, update } = useFieldArray({ control, name: "items" })

  // Leitor de código de barras (Seção 25.8): Enter no campo dedicado busca
  // o produto pelo barcode já carregado em memória (useSaleOptions), sem
  // round-trip extra. Produto já presente na lista soma +1 na quantidade;
  // senão ocupa a primeira linha vazia ou cria uma nova. Nunca encontrado
  // vira um toast, nunca uma exceção — o operador segue escaneando.
  //
  // Usa update() do useFieldArray, não setValue(): setValue num campo
  // individual de um field array atualiza o valor interno do react-hook-form
  // mas não necessariamente re-renderiza o array observado por watch() —
  // update() é o método pensado pra isso, e é o único confiável aqui
  // (bug real pego só ao testar no navegador: o input de quantidade mudava
  // por baixo dos panos, mas subtotal/total não recalculavam na tela).
  const handleBarcodeSubmit = () => {
    const code = barcodeValue.trim()
    if (!code) return
    const product = products.find((p) => p.barcode && p.barcode === code)
    if (!product) {
      toast.error(`Produto não encontrado para o código "${code}".`)
      setBarcodeValue("")
      return
    }

    const items = getValues("items")
    const existingIndex = items.findIndex((it) => it.product_id === product.id)
    if (existingIndex >= 0) {
      const currentQty = Number(items[existingIndex].quantity) || 0
      update(existingIndex, { ...items[existingIndex], quantity: (currentQty + 1) as unknown as number })
    } else {
      const emptyIndex = items.findIndex((it) => !it.product_id)
      if (emptyIndex >= 0) {
        update(emptyIndex, { product_id: product.id, quantity: 1 as unknown as number })
      } else {
        append({ product_id: product.id, quantity: 1 as unknown as number })
      }
    }
    setBarcodeValue("")
    barcodeInputRef.current?.focus()
  }

  useKeyboardShortcuts([
    { key: "F6", handler: () => barcodeInputRef.current?.focus() },
    { key: "F8", handler: () => document.getElementById("sale-discount-input")?.focus() },
    { key: "F9", handler: () => document.getElementById("sale-payment-select")?.focus() },
    { key: "F10", handler: () => formRef.current?.requestSubmit() },
  ])

  const customerOptions = [
    { value: "", label: "— Sem cliente (balcão) —" },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.name}${c.document ? ` · CPF: ${c.document}` : ""}${c.phone ? ` · Tel: ${c.phone}` : ""}`,
    })),
  ]
  const productOptions = [
    { value: "", label: "Selecione..." },
    ...products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku}) — ${formatCurrency(p.promotion_price ?? p.sale_price)} · saldo ${p.current_stock}` })),
  ]
  const paymentOptions = PAYMENT_METHODS.map((m) => ({ value: m, label: m }))

  // Preço é sempre o do catálogo (promoção, se houver) — nunca digitável.
  // A UI só mostra uma prévia; o valor real é resolvido de novo no servidor.
  const priceOf = (productId: string | undefined) => {
    const product = products.find((p) => p.id === productId)
    return product ? product.promotion_price ?? product.sale_price : 0
  }

  const watchedItems = watch("items")
  const watchedDiscount = Number(watch("discount")) || 0
  const subtotal = (watchedItems || []).reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * priceOf(it?.product_id),
    0
  )
  const total = Math.max(0, subtotal - watchedDiscount)

  const handleFormSubmit = (data: SaleFormInputs) => {
    for (const item of data.items) {
      const prod = products.find((p) => p.id === item.product_id)
      if (prod && prod.current_stock < Number(item.quantity)) {
        toast.error("Estoque insuficiente para concluir esta venda.")
        return
      }
    }
    return onSubmit(data)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Cliente (opcional)"
          options={customerOptions}
          error={errors.customer_id?.message}
          disabled={loadingOptions}
          {...register("customer_id")}
        />
        <Select
          id="sale-payment-select"
          label="Forma de pagamento (F9)"
          options={paymentOptions}
          error={errors.payment_method?.message}
          {...register("payment_method")}
        />
        <Input label="Data" type="date" error={errors.sale_date?.message} {...register("sale_date")} />
      </div>

      <Input
        label="Código de barras (F6) — escaneie ou digite e pressione Enter"
        ref={barcodeInputRef}
        value={barcodeValue}
        onChange={(e) => setBarcodeValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleBarcodeSubmit()
          }
        }}
        placeholder="0000000000000"
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground/80">Itens</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ product_id: "", quantity: "" as unknown as number })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar item
          </Button>
        </div>
        {errors.items?.message && <p className="text-xs text-destructive mb-2">{errors.items.message}</p>}

        <div className="space-y-2">
          {fields.map((field, index) => {
            const qty = Number(watchedItems?.[index]?.quantity) || 0
            const price = priceOf(watchedItems?.[index]?.product_id)
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
                    title="Delete remove o item · + / - ajusta a quantidade"
                    {...register(`items.${index}.quantity` as const)}
                    onKeyDown={(e) => {
                      if (e.key === "Delete") {
                        e.preventDefault()
                        if (fields.length > 1) remove(index)
                        return
                      }
                      if (e.key === "+" || e.key === "-") {
                        e.preventDefault()
                        const currentItem = getValues(`items.${index}`)
                        const current = Number(currentItem.quantity) || 0
                        const next = e.key === "+" ? current + 1 : Math.max(1, current - 1)
                        update(index, { ...currentItem, quantity: next as unknown as number })
                      }
                    }}
                  />
                </div>
                <div className="w-28 pt-2 text-sm text-right whitespace-nowrap" title="Preço do catálogo — não editável aqui">
                  {formatCurrency(price)}
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
        <Input
          id="sale-discount-input"
          label="Desconto (opcional) — F8"
          type="number"
          step="0.01"
          error={errors.discount?.message}
          {...register("discount")}
        />
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
