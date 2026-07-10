import * as z from "zod"

const documentDigits = (value: string) => value.replace(/\D/g, "")

export const customerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120, "Nome muito longo"),
  // Documento é opcional; se informado, precisa ser CPF (11) ou CNPJ (14).
  document: z
    .string()
    .optional()
    .refine((v) => !v || [11, 14].includes(documentDigits(v).length), {
      message: "Informe um CPF (11) ou CNPJ (14) válido, ou deixe em branco",
    }),
  phone: z.string().max(20, "Telefone muito longo").optional().or(z.literal("")),
  whatsapp: z.string().max(20, "WhatsApp muito longo").optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  birthday: z.string().optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
})

export type CustomerFormInputs = z.infer<typeof customerSchema>
