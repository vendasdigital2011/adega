"use client"

import { useEffect } from "react"
import { logClientError } from "@/lib/logger"
import "./globals.css"

// Só dispara se o próprio layout raiz (providers, fontes) lançar — por isso
// precisa recriar <html>/<body> aqui, diferente de error.tsx.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logClientError("app.global_error_boundary", error, { errorCode: error.digest })
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1.5rem",
            fontFamily: "system-ui, sans-serif",
            background: "#0a0a0a",
            color: "#f5f5f5",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Não foi possível carregar o Adega Cloud</h1>
          <p style={{ color: "#a3a3a3", marginTop: "0.5rem", maxWidth: "28rem" }}>
            Um erro inesperado impediu o carregamento da aplicação. Já foi registrado.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem",
              background: "#f5f5f5",
              color: "#0a0a0a",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
