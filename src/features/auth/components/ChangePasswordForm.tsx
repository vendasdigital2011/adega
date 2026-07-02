"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { ShieldCheck, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"

const changeSchema = z
  .object({
    currentPassword: z.string().min(1, "A senha atual é obrigatória"),
    newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "A confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })

type ChangeInputs = z.infer<typeof changeSchema>

export function ChangePasswordForm() {
  const { updatePassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeInputs>({
    resolver: zodResolver(changeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ChangeInputs) => {
    setIsLoading(true)
    try {
      await updatePassword(data.newPassword)
      toast.success("Senha alterada com sucesso!")
      reset()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Erro ao alterar senha. Verifique os dados.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full border-border/60 bg-card/40 backdrop-blur-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold">Alterar Senha de Acesso</CardTitle>
        </div>
        <CardDescription>
          Mantenha sua conta segura alterando sua senha periodicamente.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          {/* Current Password */}
          <div className="space-y-1">
            <Input
              type={showPassword ? "text" : "password"}
              label="Senha Atual"
              id="currentPassword"
              placeholder="Digite sua senha atual"
              error={errors.currentPassword?.message}
              {...register("currentPassword")}
            />
          </div>

          {/* New Password */}
          <div className="space-y-1 relative">
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground/80">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                id="newPassword"
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword?.message && (
              <p className="mt-1 text-xs text-destructive font-medium">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <Input
              type={showPassword ? "text" : "password"}
              label="Confirmar Nova Senha"
              id="confirmPassword"
              placeholder="Digite novamente"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <Button type="submit" className="font-semibold" loading={isLoading}>
            Atualizar Senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
