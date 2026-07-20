import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFilters } from "@/hooks/useFilters"

describe("useFilters", () => {
  const initial = { status: "all", search: "" }

  it("starts with the initial filters", () => {
    const { result } = renderHook(() => useFilters(initial))
    expect(result.current.filters).toEqual(initial)
  })

  it("setFilter updates a single key", () => {
    const { result } = renderHook(() => useFilters(initial))
    act(() => result.current.setFilter("status", "active"))
    expect(result.current.filters).toEqual({ status: "active", search: "" })
  })

  it("setMultiFilters merges several keys at once", () => {
    const { result } = renderHook(() => useFilters(initial))
    act(() => result.current.setMultiFilters({ status: "active", search: "vinho" }))
    expect(result.current.filters).toEqual({ status: "active", search: "vinho" })
  })

  it("resetFilters restores the initial object", () => {
    const { result } = renderHook(() => useFilters(initial))
    act(() => result.current.setFilter("status", "active"))
    act(() => result.current.resetFilters())
    expect(result.current.filters).toEqual(initial)
  })
})
