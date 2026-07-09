import * as z from "zod"

// Documento: aceita CPF (11) ou CNPJ (14) dígitos, ignorando máscara.
const documentDigits = (value: string) => value.replace(/\D/g, "")

export const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120, "Nome muito longo"),
  document: z
    .string()
    .min(1, "Documento é obrigatório")
    .refine((v) => [11, 14].includes(documentDigits(v).length), {
      message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
    }),
  phone: z.string().min(1, "Telefone é obrigatório").max(20, "Telefone muito longo"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  state: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(300).optional().or(z.literal("")),
})

export type SupplierFormInputs = z.infer<typeof supplierSchema>
