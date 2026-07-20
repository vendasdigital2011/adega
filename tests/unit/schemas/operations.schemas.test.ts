import { describe, it, expect } from "vitest"
import { movementSchema as inventoryMovementSchema } from "@/features/inventory/schemas/movement.schema"
import { purchaseSchema } from "@/features/purchases/schemas/purchase.schema"
import { saleSchema } from "@/features/sales/schemas/sale.schema"
import {
  openCashSchema,
  closeCashSchema,
  movementSchema as cashMovementSchema,
} from "@/features/cash/schemas/cash.schema"
import {
  costCenterSchema,
  receivableSchema,
  payableSchema,
  settleSchema,
} from "@/features/financial/schemas/financial.schema"

describe("inventory movementSchema", () => {
  const base = { product_id: "p1", movement_type: "Entrada" as const, quantity: 10 }

  it("accepts a valid movement", () => {
    expect(inventoryMovementSchema.safeParse(base).success).toBe(true)
  })

  it("rejects quantity 0", () => {
    expect(inventoryMovementSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false)
  })

  it("rejects a non-integer quantity", () => {
    expect(inventoryMovementSchema.safeParse({ ...base, quantity: 1.5 }).success).toBe(false)
  })

  it("accepts negative quantities (Ajuste can decrement)", () => {
    expect(inventoryMovementSchema.safeParse({ ...base, movement_type: "Ajuste", quantity: -5 }).success).toBe(true)
  })

  it("rejects a movement_type outside MOVEMENT_TYPES", () => {
    expect(inventoryMovementSchema.safeParse({ ...base, movement_type: "Invalido" }).success).toBe(false)
  })

  it("rejects a missing product_id", () => {
    const { product_id, ...rest } = base
    expect(inventoryMovementSchema.safeParse(rest).success).toBe(false)
  })
})

describe("purchaseSchema", () => {
  const item = { product_id: "p1", quantity: 2, unit_price: 15 }
  const base = { supplier_id: "s1", purchase_date: "2026-07-17", items: [item] }

  it("accepts a valid purchase", () => {
    expect(purchaseSchema.safeParse(base).success).toBe(true)
  })

  it("rejects an empty items array", () => {
    expect(purchaseSchema.safeParse({ ...base, items: [] }).success).toBe(false)
  })

  it("rejects an item with quantity <= 0", () => {
    expect(purchaseSchema.safeParse({ ...base, items: [{ ...item, quantity: 0 }] }).success).toBe(false)
  })

  it("rejects an item with a negative unit_price", () => {
    expect(purchaseSchema.safeParse({ ...base, items: [{ ...item, unit_price: -1 }] }).success).toBe(false)
  })

  it("accepts freight/discount omitted (optional)", () => {
    expect(purchaseSchema.safeParse(base).success).toBe(true)
  })

  it("rejects a negative discount", () => {
    expect(purchaseSchema.safeParse({ ...base, discount: -10 }).success).toBe(false)
  })
})

describe("saleSchema", () => {
  const item = { product_id: "p1", quantity: 1, unit_price: 89.9 }
  const base = { sale_date: "2026-07-17", payment_method: "PIX" as const, items: [item] }

  it("accepts a valid walk-in sale (no customer) for a non-Fiado method", () => {
    expect(saleSchema.safeParse(base).success).toBe(true)
  })

  it("rejects Fiado without a customer", () => {
    const result = saleSchema.safeParse({ ...base, payment_method: "Fiado" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["customer_id"])
    }
  })

  it("accepts Fiado with a customer", () => {
    expect(saleSchema.safeParse({ ...base, payment_method: "Fiado", customer_id: "c1" }).success).toBe(true)
  })

  it("rejects an empty items array", () => {
    expect(saleSchema.safeParse({ ...base, items: [] }).success).toBe(false)
  })

  it("rejects an unknown payment_method", () => {
    expect(saleSchema.safeParse({ ...base, payment_method: "Cripto" }).success).toBe(false)
  })
})

describe("cash schemas", () => {
  it("openCashSchema accepts a nonnegative initial_value", () => {
    expect(openCashSchema.safeParse({ initial_value: 100 }).success).toBe(true)
    expect(openCashSchema.safeParse({ initial_value: 0 }).success).toBe(true)
  })

  it("openCashSchema rejects a negative initial_value", () => {
    expect(openCashSchema.safeParse({ initial_value: -1 }).success).toBe(false)
  })

  it("closeCashSchema accepts a nonnegative final_value", () => {
    expect(closeCashSchema.safeParse({ final_value: 150.5 }).success).toBe(true)
  })

  it("cash movementSchema only accepts Sangria/Suprimento", () => {
    expect(cashMovementSchema.safeParse({ movement_type: "Sangria", value: 50 }).success).toBe(true)
    expect(cashMovementSchema.safeParse({ movement_type: "Suprimento", value: 50 }).success).toBe(true)
    expect(cashMovementSchema.safeParse({ movement_type: "Entrada", value: 50 }).success).toBe(false)
  })

  it("cash movementSchema rejects value <= 0", () => {
    expect(cashMovementSchema.safeParse({ movement_type: "Sangria", value: 0 }).success).toBe(false)
  })
})

describe("financial schemas", () => {
  it("costCenterSchema requires a name", () => {
    expect(costCenterSchema.safeParse({ name: "Marketing" }).success).toBe(true)
    expect(costCenterSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("receivableSchema accepts optional customer_id/cost_center_id", () => {
    expect(
      receivableSchema.safeParse({ due_date: "2026-08-01", amount: 150 }).success
    ).toBe(true)
  })

  it("receivableSchema rejects amount <= 0", () => {
    expect(receivableSchema.safeParse({ due_date: "2026-08-01", amount: 0 }).success).toBe(false)
  })

  it("receivableSchema rejects a malformed customer_id (must be a UUID when present)", () => {
    expect(
      receivableSchema.safeParse({ due_date: "2026-08-01", amount: 150, customer_id: "not-a-uuid" }).success
    ).toBe(false)
  })

  it("payableSchema requires due_date and a positive amount", () => {
    expect(payableSchema.safeParse({ due_date: "2026-08-01", amount: 200 }).success).toBe(true)
    expect(payableSchema.safeParse({ amount: 200 }).success).toBe(false)
  })

  it("settleSchema requires a positive value", () => {
    expect(settleSchema.safeParse({ value: 50 }).success).toBe(true)
    expect(settleSchema.safeParse({ value: 0 }).success).toBe(false)
  })
})
