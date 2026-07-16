import * as z from "zod"

export const companySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  document: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{11}$/.test(v.replace(/\D/g, "")) || /^\d{14}$/.test(v.replace(/\D/g, "")), {
      message: "Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)",
    }),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2, "Use a sigla do estado (ex: SP)").optional(),
  zip_code: z.string().optional(),
})

export type CompanyFormInputs = z.infer<typeof companySchema>

export const THEMES = ["light", "dark", "system"] as const
export const CURRENCIES = ["BRL"] as const
export const TIMEZONES = ["America/Sao_Paulo", "America/Manaus", "America/Cuiaba", "America/Fortaleza"] as const
export const LANGUAGES = ["pt-BR"] as const

export const preferencesSchema = z.object({
  theme: z.enum(THEMES),
  currency: z.enum(CURRENCIES),
  timezone: z.enum(TIMEZONES),
  language: z.enum(LANGUAGES),
})

export type PreferencesFormInputs = z.infer<typeof preferencesSchema>
