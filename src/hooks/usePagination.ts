"use client"

import { useState, useCallback } from "react"

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [page, setPage] = useState(options.initialPage || 1)
  const [limit, setLimit] = useState(options.initialLimit || 10)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const setPageSafe = useCallback(
    (newPage: number | ((prev: number) => number)) => {
      setPage((prev) => {
        const resolvedPage = typeof newPage === "function" ? newPage(prev) : newPage
        return Math.max(1, Math.min(resolvedPage, totalPages))
      })
    },
    [totalPages]
  )

  const nextPage = useCallback(() => setPageSafe((prev) => prev + 1), [setPageSafe])
  const prevPage = useCallback(() => setPageSafe((prev) => prev - 1), [setPageSafe])
  const firstPage = useCallback(() => setPageSafe(1), [setPageSafe])
  const lastPage = useCallback(() => setPageSafe(totalPages), [setPageSafe, totalPages])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage: setPageSafe,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
}
