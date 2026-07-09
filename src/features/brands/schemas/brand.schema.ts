import * as z from "zod"

export const brandSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
})

export type BrandFormInputs = z.infer<typeof brandSchema>
