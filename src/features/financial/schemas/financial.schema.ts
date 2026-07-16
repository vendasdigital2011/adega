import * as z from "zod"

const emptyToUndefined = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v)

const money = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ required_error: message, invalid_type_error: "Valor inválido" })
      .positive("Deve ser maior que zero")
  )

const optionalId = z.preprocess(emptyToUndefined, z.string().uuid().optional())

export const costCenterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
})
export type CostCenterFormInputs = z.infer<typeof costCenterSchema>

export const receivableSchema = z.object({
  customer_id: optionalId,
  cost_center_id: optionalId,
  description: z.string().max(200).optional().or(z.literal("")),
  due_date: z.string().min(1, "Vencimento é obrigatório"),
  amount: money("Valor é obrigatório"),
})
export type ReceivableFormInputs = z.infer<typeof receivableSchema>

export const payableSchema = z.object({
  supplier_id: optionalId,
  cost_center_id: optionalId,
  description: z.string().max(200).optional().or(z.literal("")),
  due_date: z.string().min(1, "Vencimento é obrigatório"),
  amount: money("Valor é obrigatório"),
})
export type PayableFormInputs = z.infer<typeof payableSchema>

export const settleSchema = z.object({
  value: money("Valor é obrigatório"),
  description: z.string().max(200).optional().or(z.literal("")),
})
export type SettleFormInputs = z.infer<typeof settleSchema>
