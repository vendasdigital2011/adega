"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { customerSchema, CustomerFormInputs } from "../schemas/customer.schema"
import { Customer } from "@/types"

interface CustomerFormProps {
  customer?: Customer
  onSubmit: (data: CustomerFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CustomerForm({ customer, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      document: customer?.document || "",
      phone: customer?.phone || "",
      whatsapp: customer?.whatsapp || "",
      email: customer?.email || "",
      birthday: customer?.birthday || "",
      city: customer?.city || "",
      state: customer?.state || "",
      address: customer?.address || "",
      notes: customer?.notes || "",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Documento (CPF/CNPJ) — opcional" error={errors.document?.message} {...register("document")} />
        <Input label="Aniversário (opcional)" type="date" error={errors.birthday?.message} {...register("birthday")} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Telefone (opcional)" error={errors.phone?.message} {...register("phone")} />
        <Input label="WhatsApp (opcional)" error={errors.whatsapp?.message} {...register("whatsapp")} />
      </div>
      <Input label="E-mail (opcional)" error={errors.email?.message} {...register("email")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Cidade (opcional)" error={errors.city?.message} {...register("city")} />
        <Input label="UF (opcional)" error={errors.state?.message} {...register("state")} />
      </div>
      <Input label="Endereço (opcional)" error={errors.address?.message} {...register("address")} />
      <Textarea label="Observações (opcional)" error={errors.notes?.message} {...register("notes")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          {customer ? "Salvar" : "Criar Cliente"}
        </Button>
      </div>
    </form>
  )
}
