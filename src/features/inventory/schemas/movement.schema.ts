import * as z from "zod"

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

export const MOVEMENT_TYPES = ["Entrada", "Saída", "Ajuste", "Inventário", "Perda", "Quebra"] as const

export const movementSchema = z.object({
  product_id: z.string().min(1, "Produto é obrigatório"),
  movement_type: z.enum(MOVEMENT_TYPES, { required_error: "Tipo é obrigatório" }),
  quantity: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: "Quantidade é obrigatória", invalid_type_error: "Quantidade inválida" })
      .int("Deve ser um número inteiro")
      .refine((n) => n !== 0, "Quantidade não pode ser zero")
  ),
  reference: z.string().max(120).optional().or(z.literal("")),
  observation: z.string().max(300).optional().or(z.literal("")),
})

export type MovementFormInputs = z.infer<typeof movementSchema>
