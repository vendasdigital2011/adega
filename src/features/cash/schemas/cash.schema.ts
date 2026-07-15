import * as z from "zod"

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

const money = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ required_error: message, invalid_type_error: "Valor inválido" }).nonnegative("Não pode ser negativo")
  )

export const openCashSchema = z.object({
  initial_value: money("Valor inicial é obrigatório"),
})
export type OpenCashFormInputs = z.infer<typeof openCashSchema>

export const closeCashSchema = z.object({
  final_value: money("Valor contado é obrigatório"),
})
export type CloseCashFormInputs = z.infer<typeof closeCashSchema>

export const movementSchema = z.object({
  movement_type: z.enum(["Sangria", "Suprimento"], { required_error: "Tipo é obrigatório" }),
  value: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: "Valor é obrigatório", invalid_type_error: "Valor inválido" })
      .positive("Deve ser maior que zero")
  ),
  description: z.string().max(200).optional().or(z.literal("")),
})
export type MovementFormInputs = z.infer<typeof movementSchema>
