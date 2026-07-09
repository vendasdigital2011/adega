"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { supplierSchema, SupplierFormInputs } from "../schemas/supplier.schema"
import { Supplier } from "@/types"

interface SupplierFormProps {
  supplier?: Supplier
  onSubmit: (data: SupplierFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SupplierForm({ supplier, onSubmit, onCancel, isLoading }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormInputs>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name || "",
      document: supplier?.document || "",
      phone: supplier?.phone || "",
      email: supplier?.email || "",
      city: supplier?.city || "",
      state: supplier?.state || "",
      address: supplier?.address || "",
      notes: supplier?.notes || "",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome / Razão social" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Documento (CPF/CNPJ)" error={errors.document?.message} {...register("document")} />
        <Input label="Telefone" error={errors.phone?.message} {...register("phone")} />
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
          {supplier ? "Salvar" : "Criar Fornecedor"}
        </Button>
      </div>
    </form>
  )
}
