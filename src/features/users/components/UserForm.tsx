"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { RoleSelector } from "./RoleSelector"
import {
  createUserSchema,
  editUserSchema,
  CreateUserFormInputs,
  EditUserFormInputs,
} from "../schemas/user.schema"
import { User } from "@/types"

interface FormActionsProps {
  onCancel: () => void
  isLoading?: boolean
  submitLabel: string
}

function FormActions({ onCancel, isLoading, submitLabel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
        Cancelar
      </Button>
      <Button type="submit" loading={isLoading}>
        {submitLabel}
      </Button>
    </div>
  )
}

interface CreateUserFormProps {
  onSubmit: (data: CreateUserFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function CreateUserForm({ onSubmit, onCancel, isLoading }: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormInputs>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", role_id: "" },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" error={errors.name?.message} {...register("name")} />
      <Input type="email" label="E-mail" error={errors.email?.message} {...register("email")} />
      <Input type="password" label="Senha" error={errors.password?.message} {...register("password")} />
      <Input label="Telefone" error={errors.phone?.message} {...register("phone")} />
      <RoleSelector label="Perfil" error={errors.role_id?.message} {...register("role_id")} />
      <FormActions onCancel={onCancel} isLoading={isLoading} submitLabel="Criar Usuário" />
    </form>
  )
}

interface EditUserFormProps {
  user: User
  onSubmit: (data: EditUserFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

function EditUserForm({ user, onSubmit, onCancel, isLoading }: EditUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserFormInputs>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, phone: user.phone || "", role_id: user.role_id },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Nome" error={errors.name?.message} {...register("name")} />
      <Input label="E-mail" value={user.email} disabled />
      <Input label="Telefone" error={errors.phone?.message} {...register("phone")} />
      <RoleSelector label="Perfil" error={errors.role_id?.message} {...register("role_id")} />
      <FormActions onCancel={onCancel} isLoading={isLoading} submitLabel="Salvar" />
    </form>
  )
}

interface UserFormProps {
  user?: User
  onSubmit: (data: CreateUserFormInputs | EditUserFormInputs) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  if (user) {
    return <EditUserForm user={user} onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} />
  }
  return <CreateUserForm onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} />
}
