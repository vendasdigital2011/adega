"use client"

import { Modal } from "./Modal"

interface ShortcutRow {
  keys: string
  description: string
}

interface ShortcutsHelpModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: ShortcutRow[]
}

// Tela de referência dos atalhos (auditoria "reviravolta", Seção 25.1/25.4)
// — escopo reduzido pra uma lista de consulta, sem editor de keybindings
// customizável por usuário (decisão tomada com o dono: não vale o esforço
// de UI/manutenção pra um recurso secundário).
export function ShortcutsHelpModal({ isOpen, onClose, shortcuts }: ShortcutsHelpModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atalhos de teclado" description="Pressione F1 a qualquer momento para ver esta lista.">
      <div className="space-y-1">
        {shortcuts.map((s) => (
          <div key={s.keys} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <span className="text-sm text-muted-foreground">{s.description}</span>
            <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono font-semibold">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  )
}
