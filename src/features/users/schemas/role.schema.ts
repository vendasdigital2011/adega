import * as z from "zod"

export const roleSchema = z.object({
  name: z.string().min(1, "Nome do perfil é obrigatório"),
  description: z.string().optional(),
})

export type RoleFormInputs = z.infer<typeof roleSchema>
