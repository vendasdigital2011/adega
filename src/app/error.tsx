"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { logClientError } from "@/lib/logger"

// Captura exceções não tratadas dentro da árvore de rotas (renderiza dentro
// do layout raiz, então continua com o tema/estilo do app). Erros no próprio
// layout raiz caem em global-error.tsx, que precisa recriar <html>/<body>.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logClientError("app.error_boundary", error, { errorCode: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Um erro inesperado interrompeu esta página. Já foi registrado — você pode tentar de novo ou
        voltar ao painel.
      </p>
      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button asChild>
          <Link href="/dashboard">Voltar ao painel</Link>
        </Button>
      </div>
    </div>
  )
}
