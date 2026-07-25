import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, cleanup } from "@testing-library/react"
import { useKeyboardShortcuts, type ShortcutDef } from "@/hooks/useKeyboardShortcuts"

function fireKey(init: KeyboardEventInit, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

afterEach(() => cleanup())

describe("useKeyboardShortcuts", () => {
  it("dispara o handler quando a tecla registrada é pressionada", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: "F2", handler }]))
    fireKey({ key: "F2" })
    expect(handler).toHaveBeenCalledOnce()
  })

  it("não dispara para uma tecla diferente da registrada", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: "F2", handler }]))
    fireKey({ key: "F3" })
    expect(handler).not.toHaveBeenCalled()
  })

  it("exige os modificadores exatos (ctrl/shift/alt)", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: "k", ctrl: true, handler }]))
    fireKey({ key: "k" }) // sem ctrl
    expect(handler).not.toHaveBeenCalled()
    fireKey({ key: "k", ctrlKey: true })
    expect(handler).toHaveBeenCalledOnce()
  })

  it("tecla de função dispara mesmo com foco num campo de texto", () => {
    const handler = vi.fn()
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.focus()
    renderHook(() => useKeyboardShortcuts([{ key: "F10", handler }]))
    fireKey({ key: "F10" }, input)
    expect(handler).toHaveBeenCalledOnce()
    input.remove()
  })

  it("tecla comum (Delete) NÃO dispara com foco num campo de texto, a menos que allowInTyping", () => {
    const blocked = vi.fn()
    const allowed = vi.fn()
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.focus()
    renderHook(() =>
      useKeyboardShortcuts([
        { key: "Delete", handler: blocked },
        { key: "Enter", handler: allowed, allowInTyping: true },
      ])
    )
    fireKey({ key: "Delete" }, input)
    expect(blocked).not.toHaveBeenCalled()
    fireKey({ key: "Enter" }, input)
    expect(allowed).toHaveBeenCalledOnce()
    input.remove()
  })

  it("respeita enabled: false sem precisar remover o atalho da lista", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: "F2", handler, enabled: false }]))
    fireKey({ key: "F2" })
    expect(handler).not.toHaveBeenCalled()
  })

  it("active: false não anexa listener algum", () => {
    const handler = vi.fn()
    renderHook(() => useKeyboardShortcuts([{ key: "F2", handler }], false))
    fireKey({ key: "F2" })
    expect(handler).not.toHaveBeenCalled()
  })

  it("remove o listener no unmount — handler não dispara mais depois", () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcuts([{ key: "F2", handler }]))
    unmount()
    fireKey({ key: "F2" })
    expect(handler).not.toHaveBeenCalled()
  })

  it("usa sempre a versão mais recente dos handlers (ref), sem reanexar o listener a cada render", () => {
    let counter = 0
    const { rerender } = renderHook(
      ({ shortcuts }: { shortcuts: ShortcutDef[] }) => useKeyboardShortcuts(shortcuts),
      { initialProps: { shortcuts: [{ key: "F2", handler: () => { counter = 1 } }] } }
    )
    rerender({ shortcuts: [{ key: "F2", handler: () => { counter = 2 } }] })
    fireKey({ key: "F2" })
    expect(counter).toBe(2)
  })
})
