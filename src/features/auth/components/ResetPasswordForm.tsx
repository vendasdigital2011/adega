"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { KeyRound, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"
import { getErrorMessage } from "@/lib/utils"

const resetSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })

type ResetInputs = z.infer<typeof resetSchema>

export function ResetPasswordForm() {
  const { updatePassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInputs>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: ResetInputs) => {
    setIsLoading(true)
    try {
      await updatePassword(data.password)
      toast.success("Senha atualizada com sucesso!")
      router.push("/login")
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, "Não foi possível redefinir a senha."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-blue-500" />
      
      <CardHeader className="space-y-2 text-center pt-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 shadow-inner">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Redefinir Senha
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Crie uma nova senha de acesso para sua conta.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1 relative">
            <label htmlFor="password" className="text-sm font-medium text-foreground/80">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                id="password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password?.message && (
              <p className="mt-1 text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <Input
              type={showPassword ? "text" : "password"}
              label="Confirmar Senha"
              id="confirmPassword"
              placeholder="Digite novamente"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <Button type="submit" className="w-full mt-4 font-semibold" loading={isLoading}>
            Salvar Nova Senha
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
