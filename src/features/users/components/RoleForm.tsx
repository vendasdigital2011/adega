"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import { roleSchema, RoleFormInputs } from "../schemas/role.schema"
import { Role } from "@/types"

interface RoleFormProps {
  role?: Role
  onSubmit: (data: RoleFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function RoleForm({ role, onSubmit, onCancel, isLoading }: RoleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormInputs>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: role?.name || "", description: role?.description || "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome do perfil" error={errors.name?.message} {...register("name")} />
      <Textarea label="Descrição" error={errors.description?.message} {...register("description")} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" loading={isLoading}>
          {role ? "Salvar" : "Criar Perfil"}
        </Button>
      </div>
    </form>
  )
}
