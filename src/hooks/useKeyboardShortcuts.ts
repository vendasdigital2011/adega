import { useEffect, useRef } from "react"

export interface ShortcutDef {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: (e: KeyboardEvent) => void
  // Dispara mesmo com o foco num campo de texto/select. Teclas de função
  // (F1-F12) sempre se comportam assim independente desta flag — não têm
  // significado nenhum durante digitação, então não há ambiguidade real.
  allowInTyping?: boolean
  // false desativa este atalho específico sem precisar removê-lo da lista
  // (ex.: gated por permissão do usuário).
  enabled?: boolean
}

const FUNCTION_KEY_RE = /^F\d{1,2}$/i

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  )
}

// Hook central de atalhos de teclado (auditoria "reviravolta", Seção 25).
// Um único listener por chamada, nunca duplicado, sempre limpo no unmount —
// a lista de atalhos vive numa ref pra não precisar reanexar o listener a
// cada render. O atalho chama a mesma função usada pelo botão correspondente
// (nunca reimplementa a ação nem contorna a checagem de permissão que já
// protege esse botão).
export function useKeyboardShortcuts(shortcuts: ShortcutDef[], active: boolean = true): void {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    if (!active) return

    function onKeyDown(e: KeyboardEvent) {
      const typing = isTypingTarget(e.target)
      const keyName = e.key || ""
      const codeName = e.code || ""
      const isFKey = FUNCTION_KEY_RE.test(keyName) || FUNCTION_KEY_RE.test(codeName)

      for (const s of shortcutsRef.current) {
        if (s.enabled === false) continue

        const targetKey = s.key.toLowerCase()
        const matchKey =
          targetKey === keyName.toLowerCase() ||
          targetKey === codeName.toLowerCase()

        if (!matchKey) continue
        if (!!s.ctrl !== e.ctrlKey) continue
        if (!!s.shift !== e.shiftKey) continue
        if (!!s.alt !== e.altKey) continue
        if (typing && !isFKey && !s.allowInTyping) continue

        e.preventDefault()
        s.handler(e)
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [active])
}
