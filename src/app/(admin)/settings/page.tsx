"use client"

import React from "react"
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as preferências da empresa e segurança do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Security / Password section */}
        <ChangePasswordForm />
      </div>
    </div>
  )
}
