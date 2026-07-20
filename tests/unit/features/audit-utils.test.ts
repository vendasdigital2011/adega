import { describe, it, expect } from "vitest"
import { actionLabel, tableLabel, AUDIT_ACTIONS, AUDIT_TABLES } from "@/features/audit/utils"

describe("actionLabel", () => {
  it("returns the friendly PT label + badge variant for a known action", () => {
    expect(actionLabel("INSERT")).toEqual({ label: "Inclusão", variant: "success" })
    expect(actionLabel("DELETE")).toEqual({ label: "Exclusão", variant: "destructive" })
    expect(actionLabel("LOGIN")).toEqual({ label: "Login", variant: "info" })
  })

  it("falls back to the raw action name for an unknown action", () => {
    expect(actionLabel("SOMETHING_NEW")).toEqual({ label: "SOMETHING_NEW", variant: "secondary" })
  })

  it("every action in AUDIT_ACTIONS has a matching label", () => {
    for (const { value, label } of AUDIT_ACTIONS) {
      expect(actionLabel(value).label).toBe(label)
    }
  })
})

describe("tableLabel", () => {
  it("returns the friendly PT module name for a known table", () => {
    expect(tableLabel("accounts_receivable")).toBe("Contas a receber")
    expect(tableLabel("users")).toBe("Usuários")
  })

  it("falls back to the raw table name for an unknown table", () => {
    expect(tableLabel("some_new_table")).toBe("some_new_table")
  })

  it("every table in AUDIT_TABLES has a matching label", () => {
    for (const { value, label } of AUDIT_TABLES) {
      expect(tableLabel(value)).toBe(label)
    }
  })
})
