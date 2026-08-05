"use client"

import React, { useEffect, useState } from "react"
import { MonitorDown, Check } from "lucide-react"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verifica se já está rodando como PWA (standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success("Adega Cloud instalado com sucesso como aplicativo de desktop!")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast("Para instalar, use a opção 'Instalar Adega Cloud' no menu do seu navegador (Chrome/Edge).", { icon: "💻" })
      return
    }

    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice
    if (choiceResult.outcome === "accepted") {
      toast.success("Instalando o aplicativo no seu computador...")
    }
    setDeferredPrompt(null)
  }

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
        <Check className="h-3.5 w-3.5" />
        <span>Modo App Desktop Ativo</span>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="bg-rose-950/40 hover:bg-rose-900/60 border-rose-700/60 text-rose-200 hover:text-white transition-all duration-200 shadow-sm"
      title="Instalar o Adega Cloud como aplicativo no seu computador para usar teclas de atalho livremente"
    >
      <MonitorDown className="mr-1.5 h-4 w-4 text-rose-400" />
      <span>Instalar App Desktop</span>
    </Button>
  )
}
