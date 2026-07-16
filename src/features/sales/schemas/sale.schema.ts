import * as z from "zod"

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

export const PAYMENT_METHODS = [
  "Dinheiro",
  "PIX",
  "Cartão de Débito",
  "Cartão de Crédito",
  "Boleto",
  "Transferência",
  "Fiado",
] as const

export const saleItemSchema = z.object({
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

export const saleSchema = z
  .object({
    customer_id: z.string().optional().or(z.literal("")),
    sale_date: z.string().min(1, "Data é obrigatória"),
    payment_method: z.enum(PAYMENT_METHODS, { required_error: "Forma de pagamento é obrigatória" }),
    discount: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ invalid_type_error: "Valor inválido" }).nonnegative("Não pode ser negativo").optional()
    ),
    items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
  })
  .refine((data) => data.payment_method !== "Fiado" || !!data.customer_id, {
    message: "Venda fiado exige um cliente",
    path: ["customer_id"],
  })

export type SaleFormInputs = z.infer<typeof saleSchema>
