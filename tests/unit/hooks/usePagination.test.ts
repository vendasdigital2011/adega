import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePagination } from "@/hooks/usePagination"

describe("usePagination", () => {
  it("starts at page 1, limit 10 by default", () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(1)
    expect(result.current.limit).toBe(10)
    expect(result.current.hasPrevPage).toBe(false)
  })

  it("respects initialPage/initialLimit", () => {
    const { result } = renderHook(() => usePagination({ initialPage: 2, initialLimit: 20 }))
    expect(result.current.page).toBe(2)
    expect(result.current.limit).toBe(20)
  })

  it("computes totalPages from total/limit and clamps navigation", () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 10 }))
    act(() => result.current.setTotal(35))
    expect(result.current.totalPages).toBe(4)

    act(() => result.current.lastPage())
    expect(result.current.page).toBe(4)
    expect(result.current.hasNextPage).toBe(false)

    // nextPage past the last page is clamped, not incremented further
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(4)
  })

  it("prevPage/firstPage never go below page 1", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
    act(() => result.current.firstPage())
    expect(result.current.page).toBe(1)
  })

  it("setPage accepts a function updater", () => {
    const { result } = renderHook(() => usePagination())
    act(() => result.current.setTotal(100))
    act(() => result.current.setPage((prev) => prev + 2))
    expect(result.current.page).toBe(3)
  })
})
