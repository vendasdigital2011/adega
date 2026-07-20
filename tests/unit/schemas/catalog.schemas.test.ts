import { describe, it, expect } from "vitest"
import { categorySchema } from "@/features/categories/schemas/category.schema"
import { brandSchema } from "@/features/brands/schemas/brand.schema"
import { supplierSchema } from "@/features/suppliers/schemas/supplier.schema"
import { customerSchema } from "@/features/customers/schemas/customer.schema"
import { productSchema } from "@/features/products/schemas/product.schema"

describe("categorySchema", () => {
  it("accepts a valid category", () => {
    expect(categorySchema.safeParse({ name: "Vinhos", description: "Tintos e brancos" }).success).toBe(true)
  })

  it("accepts a missing description (optional)", () => {
    expect(categorySchema.safeParse({ name: "Vinhos" }).success).toBe(true)
  })

  it("rejects an empty name", () => {
    const result = categorySchema.safeParse({ name: "" })
    expect(result.success).toBe(false)
  })

  it("rejects a name over 100 chars", () => {
    const result = categorySchema.safeParse({ name: "a".repeat(101) })
    expect(result.success).toBe(false)
  })
})

describe("brandSchema", () => {
  it("accepts a valid brand", () => {
    expect(brandSchema.safeParse({ name: "Heineken" }).success).toBe(true)
  })

  it("rejects an empty name", () => {
    expect(brandSchema.safeParse({ name: "" }).success).toBe(false)
  })
})

describe("supplierSchema", () => {
  const base = { name: "Distribuidora Teste", document: "12345678901", phone: "11987654321" }

  it("accepts a valid supplier with CPF", () => {
    expect(supplierSchema.safeParse(base).success).toBe(true)
  })

  it("accepts a valid supplier with CNPJ", () => {
    expect(supplierSchema.safeParse({ ...base, document: "12345678000199" }).success).toBe(true)
  })

  it("accepts a masked document (strips non-digits before validating)", () => {
    expect(supplierSchema.safeParse({ ...base, document: "123.456.789-01" }).success).toBe(true)
  })

  it("rejects a document with the wrong digit count", () => {
    expect(supplierSchema.safeParse({ ...base, document: "123" }).success).toBe(false)
  })

  it("rejects a missing document (required for suppliers)", () => {
    const { document, ...rest } = base
    expect(supplierSchema.safeParse(rest).success).toBe(false)
  })

  it("rejects an invalid email when provided", () => {
    expect(supplierSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false)
  })

  it("accepts an empty-string email (optional)", () => {
    expect(supplierSchema.safeParse({ ...base, email: "" }).success).toBe(true)
  })
})

describe("customerSchema", () => {
  it("accepts a customer with only a name (document is optional)", () => {
    expect(customerSchema.safeParse({ name: "Maria" }).success).toBe(true)
  })

  it("accepts a valid CPF/CNPJ when provided", () => {
    expect(customerSchema.safeParse({ name: "Maria", document: "12345678901" }).success).toBe(true)
    expect(customerSchema.safeParse({ name: "Maria", document: "12345678000199" }).success).toBe(true)
  })

  it("rejects a document with the wrong digit count when provided", () => {
    expect(customerSchema.safeParse({ name: "Maria", document: "123" }).success).toBe(false)
  })

  it("rejects an empty name", () => {
    expect(customerSchema.safeParse({ name: "" }).success).toBe(false)
  })
})

describe("productSchema", () => {
  const base = {
    name: "Vinho Tinto Cabernet 750ml",
    sku: "VNH-CAB-750",
    category_id: "11111111-1111-1111-1111-111111111111",
    sale_price: 89.9,
    minimum_stock: 10,
  }

  it("accepts a minimal valid product", () => {
    const result = productSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it("coerces string numbers for sale_price/minimum_stock", () => {
    const result = productSchema.safeParse({ ...base, sale_price: "89.9", minimum_stock: "10" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sale_price).toBe(89.9)
      expect(result.data.minimum_stock).toBe(10)
    }
  })

  it("rejects sale_price <= 0", () => {
    expect(productSchema.safeParse({ ...base, sale_price: 0 }).success).toBe(false)
    expect(productSchema.safeParse({ ...base, sale_price: -5 }).success).toBe(false)
  })

  it("treats an empty-string sale_price as missing, not zero", () => {
    const result = productSchema.safeParse({ ...base, sale_price: "" })
    expect(result.success).toBe(false)
  })

  it("rejects a non-integer minimum_stock", () => {
    expect(productSchema.safeParse({ ...base, minimum_stock: 1.5 }).success).toBe(false)
  })

  it("rejects a negative minimum_stock", () => {
    expect(productSchema.safeParse({ ...base, minimum_stock: -1 }).success).toBe(false)
  })

  it("rejects a missing category_id", () => {
    const { category_id, ...rest } = base
    expect(productSchema.safeParse(rest).success).toBe(false)
  })

  it("rejects an invalid image_url when provided", () => {
    expect(productSchema.safeParse({ ...base, image_url: "not-a-url" }).success).toBe(false)
  })
})
