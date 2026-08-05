"use client"

import React, { useState } from "react"
import { Keyboard, X, Sparkles } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

interface ShortcutGroup {
  category: string
  items: { key: string; description: string }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Frente de Venda (PDV)",
    items: [
      { key: "F6", description: "Focar leitor de código de barras / busca rápida de produto" },
      { key: "F8", description: "Focar campo de desconto" },
      { key: "F9", description: "Focar seleção de Forma de Pagamento (Dinheiro, PIX, Cartão)" },
      { key: "F10", description: "Finalizar venda / Confirmar pedido" },
      { key: "Esc", description: "Cancelar / Fechar modal atual" },
    ],
  },
  {
    category: "Caixa & Operações",
    items: [
      { key: "F2", description: "Nova venda (PDV) / Abrir caixa" },
      { key: "F3", description: "Registrar Sangria de caixa" },
      { key: "F4", description: "Registrar Suprimento de caixa" },
      { key: "F8", description: "Abrir modal de Fechamento de Caixa" },
    ],
  },
  {
    category: "Estoque & Cadastros",
    items: [
      { key: "F2", description: "Novo produto / Nova movimentação de estoque" },
      { key: "F1", description: "Abrir este Guia de Atalhos de Teclado" },
    ],
  },
]

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  // Atalho F1 para abrir a ajuda de atalhos em qualquer lugar
  useKeyboardShortcuts([
    {
      key: "F1",
      handler: () => setIsOpen(true),
    },
  ])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-all"
        title="Ver todas as teclas de atalho (Pressione F1)"
      >
        <Keyboard className="h-4 w-4 text-rose-400" />
        <span className="hidden sm:inline">Atalhos (F1)</span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Teclas de Atalho do Sistema">
        <div className="space-y-6 text-slate-200">
          <div className="p-3.5 bg-slate-900/90 border border-rose-900/40 rounded-xl flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Dica de Produtividade:</strong> No modo <strong>App Desktop Instalado (PWA)</strong>,
              as teclas de função <code className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-300">F1-F12</code> funcionam 100% livres de interferências do navegador!
            </p>
          </div>

          <div className="space-y-5">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.category} className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 border-b border-slate-800 pb-1">
                  {group.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <div
                      key={item.key + item.description}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
                    >
                      <span className="text-slate-300 font-medium">{item.description}</span>
                      <kbd className="px-2 py-1 bg-slate-800 text-slate-100 border border-slate-700 font-mono font-bold rounded shadow-sm text-xs">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              Entendido (Esc)
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
