import * as z from "zod"

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

const money = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ invalid_type_error: "Valor inválido" }).nonnegative("Não pode ser negativo").optional()
)

export const purchaseItemSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  quantity: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: "Qtd.", invalid_type_error: "Qtd. inválida" }).int("Inteiro").positive("Maior que zero")
  ),
  unit_price: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: "Preço", invalid_type_error: "Preço inválido" }).nonnegative("Não pode ser negativo")
  ),
})

export const purchaseSchema = z.object({
  supplier_id: z.string().min(1, "Fornecedor é obrigatório"),
  purchase_date: z.string().min(1, "Data é obrigatória"),
  freight: money,
  discount: money,
  notes: z.string().max(300).optional().or(z.literal("")),
  items: z.array(purchaseItemSchema).min(1, "Adicione ao menos um item"),
})

export type PurchaseFormInputs = z.infer<typeof purchaseSchema>
