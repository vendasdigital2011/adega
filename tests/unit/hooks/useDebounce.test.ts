import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "@/hooks/useDebounce"

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a"))
    expect(result.current).toBe("a")
  })

  it("delays updates by the given delay", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    // Still the old value before the delay elapses.
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe("b")
  })

  it("resets the timer on rapid successive changes", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    rerender({ value: "c" })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    // 400ms elapsed total, but the timer was reset at 200ms — "c" needs
    // another 100ms before it commits.
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe("c")
  })
})
