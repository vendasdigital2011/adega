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
import { Mail, ArrowLeft, Send } from "lucide-react"
import toast from "react-hot-toast"

const forgotSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("Formato de e-mail inválido"),
})

type ForgotInputs = z.infer<typeof forgotSchema>

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInputs>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotInputs) => {
    setIsLoading(true)
    try {
      await resetPassword(data.email)
      setIsSent(true)
      toast.success("E-mail de recuperação enviado!")
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Erro ao processar solicitação. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 bg-card/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-blue-500" />
      
      <CardHeader className="space-y-2 text-center pt-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2 shadow-inner">
          <Mail className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Recuperar Senha
        </CardTitle>
        <CardDescription className="text-muted-foreground/80">
          {isSent
            ? "Verifique sua caixa de entrada para redefinir a senha."
            : "Informe seu e-mail para receber o link de redefinição."}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-2">
        {isSent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enviamos as instruções para o seu e-mail. Se você não receber em alguns minutos, verifique sua pasta de spam.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
              Tentar outro e-mail
            </Button>
            <Link
              href="/login"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors justify-center mt-2 w-full"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1 relative">
              <Input
                type="email"
                label="E-mail de cadastro"
                id="email"
                placeholder="exemplo@adegacloud.com"
                error={errors.email?.message}
                className="pl-10"
                {...register("email")}
              />
              <Mail className="absolute left-3.5 top-[39px] h-4 w-4 text-muted-foreground/60" />
            </div>

            <Button type="submit" className="w-full mt-4 font-semibold" loading={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Link
            </Button>

            <Link
              href="/login"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors justify-center mt-4 w-full"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Voltar para o login
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
