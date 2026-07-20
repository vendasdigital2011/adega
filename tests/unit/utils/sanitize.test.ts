import { describe, it, expect } from "vitest"
import { sanitizeSearchTerm } from "@/utils/sanitize"

describe("sanitizeSearchTerm", () => {
  it("strips commas (PostgREST or-condition separator)", () => {
    expect(sanitizeSearchTerm("vinho,status.eq.blocked")).toBe("vinhostatus.eq.blocked")
  })

  it("strips parentheses (PostgREST grouping)", () => {
    expect(sanitizeSearchTerm("vinho(injetado)")).toBe("vinhoinjetado")
  })

  it("trims surrounding whitespace", () => {
    expect(sanitizeSearchTerm("  vinho  ")).toBe("vinho")
  })

  it("leaves a normal search term untouched", () => {
    expect(sanitizeSearchTerm("Vinho Tinto Cabernet")).toBe("Vinho Tinto Cabernet")
  })

  it("returns an empty string when input is only special characters", () => {
    expect(sanitizeSearchTerm(",()")).toBe("")
  })
})
