import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CustomerService", () => ({ customerService: { list: vi.fn() } }))
vi.mock("@/services/SupplierService", () => ({ supplierService: { list: vi.fn() } }))
vi.mock("@/services/CostCenterService", () => ({ costCenterService: { listActive: vi.fn(), list: vi.fn() } }))

import { customerService } from "@/services/CustomerService"
import { supplierService } from "@/services/SupplierService"
import { costCenterService } from "@/services/CostCenterService"
import { useFinancialOptions } from "@/features/financial/hooks/useFinancialOptions"

describe("useFinancialOptions", () => {
  beforeEach(() => vi.clearAllMocks())

  it("agrega clientes, fornecedores e centros de custo ativos", async () => {
    vi.mocked(customerService.list).mockResolvedValue({ data: [{ id: "c1" }], total: 1 } as any)
    vi.mocked(supplierService.list).mockResolvedValue({ data: [{ id: "s1" }], total: 1 } as any)
    vi.mocked(costCenterService.listActive).mockResolvedValue([{ id: "cc1" }] as any)

    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useFinancialOptions(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.customers).toEqual([{ id: "c1" }])
    expect(result.current.suppliers).toEqual([{ id: "s1" }])
    expect(result.current.costCenters).toEqual([{ id: "cc1" }])
  })
})
