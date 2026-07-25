"use client"

import React, { useState, useRef } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { Loading } from "@/components/ui/Loading"
import { AlertTriangle, Plus, Trash2, RotateCcw, Download, Upload } from "lucide-react"
import { keyboardShortcutService } from "@/services/KeyboardShortcutService"
import type { KeyboardShortcut } from "@/services/KeyboardShortcutService"

export function KeyboardShortcutsManager() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([])
  const [conflicts, setConflicts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge")
  const [importLoading, setImportLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    ctrl: false,
    shift: false,
    alt: false,
    action: "",
    description: "",
    module: "",
    enabled: true,
  })

  React.useEffect(() => {
    loadShortcuts()
    checkConflicts()
  }, [])

  const loadShortcuts = async () => {
    try {
      setIsLoading(true)
      const data = await keyboardShortcutService.list()
      setShortcuts(data)
    } catch (error) {
      toast.error("Não foi possível carregar os atalhos")
    } finally {
      setIsLoading(false)
    }
  }

  const checkConflicts = async () => {
    try {
      const data = await keyboardShortcutService.detectConflicts()
      setConflicts(data)
    } catch (error) {
      // Silently fail — conflitos são informativos
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.key || !formData.action) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }

      if (editingId) {
        await keyboardShortcutService.update(editingId, formData)
        toast.success("Atalho atualizado!")
      } else {
        await keyboardShortcutService.create(formData)
        toast.success("Atalho criado!")
      }

      setIsModalOpen(false)
      setEditingId(null)
      setFormData({
        name: "",
        key: "",
        ctrl: false,
        shift: false,
        alt: false,
        action: "",
        description: "",
        module: "",
        enabled: true,
      })
      await loadShortcuts()
    } catch (error: any) {
      if (error?.code === "SHORTCUT_CONFLICT") {
        toast.error(error.message)
      } else {
        toast.error("Erro ao salvar atalho")
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja deletar este atalho?")) return
    try {
      await keyboardShortcutService.delete(id)
      toast.success("Atalho deletado!")
      await loadShortcuts()
    } catch (error) {
      toast.error("Erro ao deletar atalho")
    }
  }

  const handleRestore = async () => {
    if (!confirm("Deseja restaurar os atalhos padrão? Suas customizações serão perdidas.")) return
    try {
      await keyboardShortcutService.restoreDefaults()
      toast.success("Atalhos restaurados aos padrões!")
      await loadShortcuts()
    } catch (error) {
      toast.error("Erro ao restaurar atalhos")
    }
  }

  const handleExport = async () => {
    try {
      const json = await keyboardShortcutService.exportAsJson()
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `shortcuts-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Atalhos exportados!")
    } catch (error) {
      toast.error("Erro ao exportar atalhos")
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImportLoading(true)
      const content = await file.text()

      const created = await keyboardShortcutService.importFromJson(content, {
        mode: importMode,
      })

      toast.success(`${created} atalho(s) importado(s)!`)
      setIsImportModalOpen(false)
      setImportMode("merge")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      await loadShortcuts()
    } catch (error: any) {
      toast.error(error?.message || "Erro ao importar atalhos")
    } finally {
      setImportLoading(false)
    }
  }

  const openEditModal = (shortcut: KeyboardShortcut) => {
    setFormData({
      name: shortcut.name,
      key: shortcut.key,
      ctrl: shortcut.ctrl,
      shift: shortcut.shift,
      alt: shortcut.alt,
      action: shortcut.action,
      description: shortcut.description || "",
      module: shortcut.module || "",
      enabled: shortcut.enabled,
    })
    setEditingId(shortcut.id)
    setIsModalOpen(true)
  }

  const getShortcutDisplay = (s: KeyboardShortcut): string => {
    const parts = [s.key]
    if (s.ctrl) parts.unshift("Ctrl")
    if (s.shift) parts.unshift("Shift")
    if (s.alt) parts.unshift("Alt")
    return parts.join(" + ")
  }

  return (
    <div className="space-y-6">
      {conflicts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Conflitos detectados</p>
                <p className="text-sm text-yellow-800">
                  {conflicts.length} combinação(ões) de atalho ativa(s) aparecem mais de uma vez. Considere desativar
                  duplicatas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Atalho
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar JSON
        </Button>
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importar JSON
        </Button>
        <Button variant="outline" onClick={handleRestore}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isLoading ? (
        <Loading />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Atalhos de Teclado ({shortcuts.length})</CardTitle>
            <CardDescription>Customize os atalhos da sua empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atalho</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortcuts.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-semibold">{getShortcutDisplay(s)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.action}</TableCell>
                    <TableCell className="text-sm">{s.description || "—"}</TableCell>
                    <TableCell className="text-sm">{s.module || "Global"}</TableCell>
                    <TableCell>
                      <Badge variant={s.enabled ? "success" : "secondary"}>
                        {s.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(s)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Atalhos do JSON"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Modo de Importação</label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === "merge"}
                  onChange={(e) => setImportMode(e.target.value as "merge" | "replace")}
                />
                <span className="text-sm">
                  <strong>Mesclar</strong> (manter atalhos existentes, atualizar duplicatas)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === "replace"}
                  onChange={(e) => setImportMode(e.target.value as "merge" | "replace")}
                />
                <span className="text-sm">
                  <strong>Substituir</strong> (deletar todos os atalhos e usar apenas os do arquivo)
                </span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleImportClick}
            disabled={importLoading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar Arquivo JSON
          </Button>

          <p className="text-xs text-muted-foreground">
            Selecione um arquivo .json exportado de outra empresa. Arquivo deve conter um array de atalhos com campos:
            key, action, ctrl, shift, alt, enabled, etc.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingId(null)
          setFormData({
            name: "",
            key: "",
            ctrl: false,
            shift: false,
            alt: false,
            action: "",
            description: "",
            module: "",
            enabled: true,
          })
        }}
        title={editingId ? "Editar Atalho" : "Novo Atalho"}
      >
        <div className="space-y-4">
          <Input
            label="Nome do atalho (ex: F1, Ctrl+N)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Tecla base (ex: F, N, Delete)"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Modificadores</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ctrl}
                  onChange={(e) => setFormData({ ...formData, ctrl: e.target.checked })}
                />
                <span className="text-sm">Ctrl</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.checked })}
                />
                <span className="text-sm">Shift</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.checked })}
                />
                <span className="text-sm">Alt</span>
              </label>
            </div>
          </div>

          <Input
            label="Ação (ex: new_sale, open_help)"
            value={formData.action}
            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
          />

          <Input
            label="Descrição (opcional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Select
            label="Módulo (opcional)"
            options={[
              { value: "", label: "—  Global  —" },
              { value: "sales", label: "Vendas" },
              { value: "inventory", label: "Estoque" },
              { value: "products", label: "Produtos" },
              { value: "cash", label: "Caixa" },
            ]}
            value={formData.module}
            onChange={(e) => setFormData({ ...formData, module: e.target.value })}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            />
            <span className="text-sm font-medium">Ativo</span>
          </label>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false)
                setEditingId(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
