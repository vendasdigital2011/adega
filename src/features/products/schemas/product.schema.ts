import * as z from "zod"

// Converte "" / null / undefined em undefined antes de validar números,
// evitando que z.coerce.number() transforme string vazia em 0.
const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

const requiredPrice = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ required_error: "Preço de venda é obrigatório", invalid_type_error: "Preço inválido" })
    .positive("Preço de venda deve ser maior que zero")
)

const optionalPrice = z.preprocess(
  emptyToUndefined,
  z.coerce.number({ invalid_type_error: "Valor inválido" }).nonnegative("Não pode ser negativo").optional()
)

const requiredStock = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ required_error: "Estoque mínimo é obrigatório", invalid_type_error: "Valor inválido" })
    .int("Deve ser um número inteiro")
    .min(0, "Não pode ser negativo")
)

export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(150, "Nome muito longo"),
  sku: z.string().min(1, "SKU é obrigatório").max(60, "SKU muito longo"),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  brand_id: z.string().optional().or(z.literal("")),
  supplier_id: z.string().optional().or(z.literal("")),
  barcode: z.string().max(60).optional().or(z.literal("")),
  unit: z.string().max(20).optional().or(z.literal("")),
  sale_price: requiredPrice,
  purchase_price: optionalPrice,
  wholesale_price: optionalPrice,
  promotion_price: optionalPrice,
  minimum_stock: requiredStock,
  description: z.string().max(500).optional().or(z.literal("")),
  image_url: z.string().url("URL inválida").optional().or(z.literal("")),
  batch_number: z.string().max(60).optional().or(z.literal("")).nullable(),
  expiry_date: z.string().date().optional().or(z.literal("")).nullable(),
})

export type ProductFormInputs = z.infer<typeof productSchema>
