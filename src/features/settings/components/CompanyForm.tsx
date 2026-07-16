"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { companySchema, CompanyFormInputs } from "../schemas/settings.schema"
import { Company } from "@/types"

interface CompanyFormProps {
  company: Company
  canEdit: boolean
  isLoading?: boolean
  onSubmit: (data: CompanyFormInputs) => void | Promise<void>
}

export function CompanyForm({ company, canEdit, isLoading = false, onSubmit }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormInputs>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name || "",
      document: company.document || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zip_code: company.zip_code || "",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Nome da empresa" error={errors.name?.message} disabled={!canEdit} {...register("name")} />
        <Input label="CNPJ / CPF" error={errors.document?.message} disabled={!canEdit} {...register("document")} />
        <Input label="E-mail" type="email" error={errors.email?.message} disabled={!canEdit} {...register("email")} />
        <Input label="Telefone" error={errors.phone?.message} disabled={!canEdit} {...register("phone")} />
        <Input label="Endereço" error={errors.address?.message} disabled={!canEdit} {...register("address")} />
        <Input label="Cidade" error={errors.city?.message} disabled={!canEdit} {...register("city")} />
        <Input label="Estado (UF)" maxLength={2} error={errors.state?.message} disabled={!canEdit} {...register("state")} />
        <Input label="CEP" error={errors.zip_code?.message} disabled={!canEdit} {...register("zip_code")} />
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={isLoading}>
            Salvar dados da empresa
          </Button>
        </div>
      )}
    </form>
  )
}
