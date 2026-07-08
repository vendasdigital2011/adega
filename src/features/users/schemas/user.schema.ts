import * as z from "zod"

export const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "E-mail é obrigatório").email("Formato de e-mail inválido"),
  phone: z.string().optional(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  role_id: z.string().min(1, "Perfil é obrigatório"),
})

export type CreateUserFormInputs = z.infer<typeof createUserSchema>

export const editUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  role_id: z.string().min(1, "Perfil é obrigatório"),
})

export type EditUserFormInputs = z.infer<typeof editUserSchema>
