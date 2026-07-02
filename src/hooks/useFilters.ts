"use client"

import { useState, useCallback } from "react"

export function useFilters<T extends Record<string, unknown>>(initialFilters: T) {
  const [filters, setFilters] = useState<T>(initialFilters)

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const setMultiFilters = useCallback((newFilters: Partial<T>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  return {
    filters,
    setFilter,
    setMultiFilters,
    resetFilters,
  }
}
