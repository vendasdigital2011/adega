import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"

const setTheme = vi.fn()

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme, resolvedTheme: "dark" }),
}))

import { useTheme } from "@/hooks/useTheme"

describe("useTheme", () => {
  it("expõe isDark com base no resolvedTheme", () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.isDark).toBe(true)
    expect(result.current.theme).toBe("dark")
  })

  it("toggleTheme alterna de dark para light", () => {
    const { result } = renderHook(() => useTheme())
    result.current.toggleTheme()
    expect(setTheme).toHaveBeenCalledWith("light")
  })
})
