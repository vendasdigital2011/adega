"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { preferencesSchema, PreferencesFormInputs } from "../schemas/settings.schema"
import { Settings } from "@/types"

interface PreferencesFormProps {
  settings: Settings | null
  canEdit: boolean
  isLoading?: boolean
  onSubmit: (data: PreferencesFormInputs) => void | Promise<void>
}

const THEME_OPTIONS = [
  { value: "system", label: "Automático (sistema)" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
]

const CURRENCY_OPTIONS = [{ value: "BRL", label: "Real (R$)" }]

const TIMEZONE_OPTIONS = [
  { value: "America/Sao_Paulo", label: "Brasília (America/Sao_Paulo)" },
  { value: "America/Manaus", label: "Manaus (America/Manaus)" },
  { value: "America/Cuiaba", label: "Cuiabá (America/Cuiaba)" },
  { value: "America/Fortaleza", label: "Fortaleza (America/Fortaleza)" },
]

const LANGUAGE_OPTIONS = [{ value: "pt-BR", label: "Português (Brasil)" }]

export function PreferencesForm({ settings, canEdit, isLoading = false, onSubmit }: PreferencesFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormInputs>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: settings?.theme || "system",
      currency: (settings?.currency as PreferencesFormInputs["currency"]) || "BRL",
      timezone: (settings?.timezone as PreferencesFormInputs["timezone"]) || "America/Sao_Paulo",
      language: (settings?.language as PreferencesFormInputs["language"]) || "pt-BR",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Tema" options={THEME_OPTIONS} error={errors.theme?.message} disabled={!canEdit} {...register("theme")} />
        <Select label="Moeda" options={CURRENCY_OPTIONS} error={errors.currency?.message} disabled={!canEdit} {...register("currency")} />
        <Select label="Fuso horário" options={TIMEZONE_OPTIONS} error={errors.timezone?.message} disabled={!canEdit} {...register("timezone")} />
        <Select label="Idioma" options={LANGUAGE_OPTIONS} error={errors.language?.message} disabled={!canEdit} {...register("language")} />
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={isLoading}>
            Salvar preferências
          </Button>
        </div>
      )}
    </form>
  )
}
