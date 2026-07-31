"use client"

import React from "react"
import toast from "react-hot-toast"
import { Building2, Palette, DatabaseBackup, Plug, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm"
import { CompanyForm } from "@/features/settings/components/CompanyForm"
import { PreferencesForm } from "@/features/settings/components/PreferencesForm"
import { KeyboardShortcutsManager } from "@/features/settings/components/KeyboardShortcutsManager"
import { PermissionsManager } from "@/features/settings/components/PermissionsManager"
import {
  useCompany,
  useSettings,
  useUpdateCompany,
  useUpsertSettings,
  useExportBackup,
} from "@/features/settings/hooks/useSettings"
import { usePermission } from "@/hooks/usePermission"
import { useTheme } from "@/hooks/useTheme"
import { getErrorMessage } from "@/lib/utils"

export default function SettingsPage() {
  const canView = usePermission("settings.view")
  const canEdit = usePermission("settings.edit")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Dados da empresa, controle de permissões, preferências, backup, atalhos e segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {canView && <CompanySection canEdit={canEdit} />}
        {canEdit && <PermissionsManager />}
        {canView && <PreferencesSection canEdit={canEdit} />}
        {canView && <BackupSection />}
        {canView && <IntegrationsSection />}
        {canEdit && <KeyboardShortcutsSection />}

        {/* Segurança: disponível para qualquer usuário autenticado */}
        <ChangePasswordForm />
      </div>
    </div>
  )
}

// ============================================================
// Dados da Empresa
// ============================================================
function CompanySection({ canEdit }: { canEdit: boolean }) {
  const { data: company, isLoading } = useCompany()
  const updateCompany = useUpdateCompany()

  return (
    <Card className="bg-card/30 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Dados da Empresa
        </CardTitle>
        <CardDescription>Informações cadastrais exibidas em relatórios e documentos.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !company ? (
          <Loading />
        ) : (
          <CompanyForm
            company={company}
            canEdit={canEdit}
            isLoading={updateCompany.isPending}
            onSubmit={async (formData) => {
              try {
                await updateCompany.mutateAsync(formData)
                toast.success("Dados da empresa salvos!")
              } catch (error) {
                toast.error(getErrorMessage(error, "Não foi possível salvar os dados da empresa."))
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Preferências
// ============================================================
function PreferencesSection({ canEdit }: { canEdit: boolean }) {
  const { data: settings, isLoading } = useSettings()
  const upsertSettings = useUpsertSettings()
  const { setTheme } = useTheme()

  return (
    <Card className="bg-card/30 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" /> Preferências
        </CardTitle>
        <CardDescription>Tema, moeda, fuso horário e idioma do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading />
        ) : (
          <PreferencesForm
            settings={settings ?? null}
            canEdit={canEdit}
            isLoading={upsertSettings.isPending}
            onSubmit={async (formData) => {
              try {
                await upsertSettings.mutateAsync(formData)
                // Aplica o tema imediatamente no navegador atual
                setTheme(formData.theme)
                toast.success("Preferências salvas!")
              } catch (error) {
                toast.error(getErrorMessage(error, "Não foi possível salvar as preferências."))
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Backup
// ============================================================
function BackupSection() {
  const exportBackup = useExportBackup()

  const handleExport = async () => {
    try {
      const payload = await exportBackup.mutateAsync()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup-adega-${payload.exported_at.slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success("Backup gerado!")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível gerar o backup."))
    }
  }

  return (
    <Card className="bg-card/30 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseBackup className="h-5 w-5" /> Backup
        </CardTitle>
        <CardDescription>
          Exporta todos os dados da empresa que o seu usuário pode visualizar em um arquivo JSON.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleExport} loading={exportBackup.isPending}>
          Baixar backup (JSON)
        </Button>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Atalhos de Teclado
// ============================================================
function KeyboardShortcutsSection() {
  return (
    <Card className="bg-card/30 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" /> Atalhos de Teclado
        </CardTitle>
        <CardDescription>Customize os atalhos de teclado da sua empresa (Etapa 6 Fase 2).</CardDescription>
      </CardHeader>
      <CardContent>
        <KeyboardShortcutsManager />
      </CardContent>
    </Card>
  )
}

// ============================================================
// Integrações
// ============================================================
function IntegrationsSection() {
  return (
    <Card className="bg-card/30 border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5" /> Integrações
        </CardTitle>
        <CardDescription>Conexões com serviços externos.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Nenhuma integração disponível no momento. Integrações fiscais e de pagamento estão previstas para
          versões futuras.
        </p>
      </CardContent>
    </Card>
  )
}
