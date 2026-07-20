import { describe, it, expect } from "vitest"
import { cn, getErrorMessage } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1")
  })

  it("resolves conflicting Tailwind classes to the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("drops falsy values", () => {
    expect(cn("px-2", false, undefined, null, "py-1")).toBe("px-2 py-1")
  })
})

describe("getErrorMessage", () => {
  it("extracts message from an error-like object", () => {
    expect(getErrorMessage({ message: "Falha ao salvar." }, "fallback")).toBe("Falha ao salvar.")
  })

  it("returns the fallback when message is missing", () => {
    expect(getErrorMessage({}, "fallback")).toBe("fallback")
  })

  it("returns the fallback for non-object errors", () => {
    expect(getErrorMessage("string error", "fallback")).toBe("fallback")
    expect(getErrorMessage(null, "fallback")).toBe("fallback")
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback")
  })
})
