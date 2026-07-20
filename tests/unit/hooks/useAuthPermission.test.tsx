import { describe, it, expect } from "vitest"
import React from "react"
import { renderHook } from "@testing-library/react"
import { AuthContext } from "@/providers/AuthProvider"
import { useAuth } from "@/hooks/useAuth"
import { usePermission } from "@/hooks/usePermission"

function makeAuthValue(permissions: { id: string; name: string; description: string }[]) {
  return {
    user: null,
    company: null,
    role: null,
    permissions,
    loading: false,
    login: async () => {},
    logout: async () => {},
    resetPassword: async () => {},
    updatePassword: async () => {},
    refreshSession: async () => {},
  }
}

describe("useAuth", () => {
  it("lança um erro quando usado fora do AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/)
  })

  it("retorna o contexto quando dentro do AuthProvider", () => {
    const value = makeAuthValue([])
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current).toBe(value)
  })
})

describe("usePermission", () => {
  const wrapperWith = (permissions: { id: string; name: string; description: string }[]) => {
    const value = makeAuthValue(permissions)
    return ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    )
  }

  it("retorna true quando a permissão está na lista do usuário", () => {
    const wrapper = wrapperWith([{ id: "1", name: "categories.view", description: "" }])
    const { result } = renderHook(() => usePermission("categories.view"), { wrapper })
    expect(result.current).toBe(true)
  })

  it("retorna false quando a permissão não está na lista", () => {
    const wrapper = wrapperWith([{ id: "1", name: "categories.view", description: "" }])
    const { result } = renderHook(() => usePermission("financial.view"), { wrapper })
    expect(result.current).toBe(false)
  })

  it("retorna false para uma lista de permissões vazia", () => {
    const wrapper = wrapperWith([])
    const { result } = renderHook(() => usePermission("audit.view"), { wrapper })
    expect(result.current).toBe(false)
  })
})
