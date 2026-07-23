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

// unit_price não faz parte do input do usuário — o preço é sempre resolvido
// no servidor a partir do catálogo (products.sale_price/promotion_price),
// nunca a partir do que o cliente envia (ver migration 0021).
export const saleItemSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  quantity: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: "Qtd.", invalid_type_error: "Qtd. inválida" }).int("Inteiro").positive("Maior que zero")
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
