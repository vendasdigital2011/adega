"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Wine, Eye, EyeOff, Lock, Mail } from "lucide-react"
import toast from "react-hot-toast"
import { getErrorMessage } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("Formato de e-mail inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
})

type LoginInputs = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginInputs) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success("Login realizado com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, "E-mail ou senha incorretos."))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Visual top accent line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-blue-500 to-indigo-600" />
      
      <CardHeader className="space-y-2 text-center pt-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 shadow-inner">
          <Wine className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Acesse sua Adega
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          Entre com seu e-mail e senha para acessar o painel.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1 relative">
            <Input
              type="email"
              label="E-mail"
              id="email"
              placeholder="exemplo@adegacloud.com"
              error={errors.email?.message}
              className="pl-10"
              {...register("email")}
            />
            <Mail className="absolute left-3.5 top-[39px] h-4 w-4 text-muted-foreground/60" />
          </div>

          {/* Password Input */}
          <div className="space-y-1 relative">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline hover:text-primary/90 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                id="password"
                {...register("password")}
              />
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60" />
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

          {/* Action button */}
          <Button type="submit" className="w-full mt-6 h-10 font-semibold" loading={isLoading}>
            Entrar no Painel
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
