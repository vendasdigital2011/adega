import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CustomerService", () => ({ customerService: { list: vi.fn() } }))
vi.mock("@/services/ProductService", () => ({ productService: { list: vi.fn() } }))

import { customerService } from "@/services/CustomerService"
import { productService } from "@/services/ProductService"
import { useSaleOptions } from "@/features/sales/hooks/useSaleOptions"

describe("useSaleOptions", () => {
  beforeEach(() => vi.clearAllMocks())

  it("agrega clientes ativos e produtos ativos", async () => {
    vi.mocked(customerService.list).mockResolvedValue({ data: [{ id: "c1" }], total: 1 } as any)
    vi.mocked(productService.list).mockResolvedValue({ data: [{ id: "p1" }], total: 1 } as any)

    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSaleOptions(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.customers).toEqual([{ id: "c1" }])
    expect(result.current.products).toEqual([{ id: "p1" }])
  })
})
