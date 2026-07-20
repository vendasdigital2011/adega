import { describe, it, expect, vi, afterEach } from "vitest"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPhone,
  formatDocument,
  calculateMargin,
} from "@/utils/format"

// Intl.NumberFormat("pt-BR", { style: "currency" }) can insert a non-breaking
// space (U+00A0) between "R$" and the number depending on the ICU build —
// normalize before comparing so the test doesn't depend on that byte.
const norm = (s: string) => s.replace(/\s/g, " ")

describe("formatCurrency", () => {
  it("formats a positive number as BRL", () => {
    expect(norm(formatCurrency(1234.5))).toBe("R$ 1.234,50")
  })

  it("formats a numeric string", () => {
    expect(norm(formatCurrency("89.9"))).toBe("R$ 89,90")
  })

  it("returns R$ 0,00 for null/undefined/NaN", () => {
    expect(norm(formatCurrency(null))).toBe("R$ 0,00")
    expect(norm(formatCurrency(undefined))).toBe("R$ 0,00")
    expect(norm(formatCurrency("abc"))).toBe("R$ 0,00")
  })
})

describe("formatDate", () => {
  it("formats a date-only string (YYYY-MM-DD) without UTC day-shift", () => {
    // Regression: naive `new Date("2026-07-17")` parses as UTC midnight,
    // which prints as 16/07 in America/Sao_Paulo (UTC-3) without the fix.
    expect(formatDate("2026-07-17")).toBe("17/07/2026")
  })

  it("formats a full ISO timestamp", () => {
    expect(formatDate("2026-01-05T12:00:00Z")).toBe("05/01/2026")
  })

  it("formats a Date object", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("05/01/2026")
  })

  it("returns - for null/undefined/invalid", () => {
    expect(formatDate(null)).toBe("-")
    expect(formatDate(undefined)).toBe("-")
    expect(formatDate("not-a-date")).toBe("-")
  })
})

describe("formatDateTime", () => {
  it("formats date and time", () => {
    const result = formatDateTime("2026-07-17T20:10:00")
    expect(result).toMatch(/^17\/07\/2026,? \d{2}:\d{2}$/)
  })

  it("returns - for null/undefined/invalid", () => {
    expect(formatDateTime(null)).toBe("-")
    expect(formatDateTime("garbage")).toBe("-")
  })
})

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 'agora mesmo' for < 30s ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T12:00:10Z"))
    expect(formatRelativeTime("2026-07-17T12:00:00Z")).toBe("agora mesmo")
  })

  it("returns minutes for < 1 hour ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T12:10:00Z"))
    expect(formatRelativeTime("2026-07-17T12:00:00Z")).toBe("há 10 min")
  })

  it("returns hours for < 24h ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-17T15:00:00Z"))
    expect(formatRelativeTime("2026-07-17T12:00:00Z")).toBe("há 3h")
  })

  it("returns 'ontem' for exactly 1 day ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-18T12:00:00Z"))
    expect(formatRelativeTime("2026-07-17T12:00:00Z")).toBe("ontem")
  })

  it("returns days for < 30 days ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-22T12:00:00Z"))
    expect(formatRelativeTime("2026-07-17T12:00:00Z")).toBe("há 5 dias")
  })

  it("falls back to formatDate for >= 30 days ago", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-01T12:00:00Z"))
    expect(formatRelativeTime("2026-07-17T12:00:00Z")).toBe("17/07/2026")
  })

  it("returns - for null", () => {
    expect(formatRelativeTime(null)).toBe("-")
  })
})

describe("formatPhone", () => {
  it("formats an 11-digit mobile number", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321")
  })

  it("formats a 10-digit landline number", () => {
    expect(formatPhone("1132654321")).toBe("(11) 3265-4321")
  })

  it("returns the raw string when length is neither 10 nor 11", () => {
    expect(formatPhone("123")).toBe("123")
  })

  it("returns - for null/undefined", () => {
    expect(formatPhone(null)).toBe("-")
    expect(formatPhone(undefined)).toBe("-")
  })
})

describe("formatDocument", () => {
  it("formats an 11-digit CPF", () => {
    expect(formatDocument("12345678901")).toBe("123.456.789-01")
  })

  it("formats a 14-digit CNPJ", () => {
    expect(formatDocument("12345678000199")).toBe("12.345.678/0001-99")
  })

  it("returns the raw string for other lengths", () => {
    expect(formatDocument("123")).toBe("123")
  })

  it("returns - for null/undefined", () => {
    expect(formatDocument(null)).toBe("-")
    expect(formatDocument(undefined)).toBe("-")
  })
})

describe("calculateMargin", () => {
  it("computes margin percentage", () => {
    expect(calculateMargin(15, 89.9)).toBeCloseTo(83.31, 2)
  })

  it("returns 0 when sale price is 0 or negative", () => {
    expect(calculateMargin(15, 0)).toBe(0)
    expect(calculateMargin(15, -10)).toBe(0)
  })

  it("returns a negative margin when selling below cost", () => {
    expect(calculateMargin(100, 50)).toBe(-100)
  })
})
