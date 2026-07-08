import * as z from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().max(255, "Descrição muito longa").optional(),
})

export type CategoryFormInputs = z.infer<typeof categorySchema>
