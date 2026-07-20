import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CostCenterService", () => ({
  costCenterService: { list: vi.fn(), listActive: vi.fn(), create: vi.fn(), setActive: vi.fn() },
}))
vi.mock("@/services/AccountsReceivableService", () => ({
  accountsReceivableService: {
    list: vi.fn(),
    listReceipts: vi.fn(),
    create: vi.fn(),
    registerReceipt: vi.fn(),
    cancel: vi.fn(),
  },
}))
vi.mock("@/services/AccountsPayableService", () => ({
  accountsPayableService: {
    list: vi.fn(),
    listPayments: vi.fn(),
    create: vi.fn(),
    registerPayment: vi.fn(),
    cancel: vi.fn(),
  },
}))
vi.mock("@/services/FinancialService", () => ({
  financialService: { getCashFlow: vi.fn() },
}))

import { costCenterService } from "@/services/CostCenterService"
import { accountsReceivableService } from "@/services/AccountsReceivableService"
import { accountsPayableService } from "@/services/AccountsPayableService"
import { financialService } from "@/services/FinancialService"
import {
  useCostCenters,
  useActiveCostCenters,
  useCreateCostCenter,
  useSetCostCenterActive,
  useReceivables,
  useReceivableReceipts,
  useCreateReceivable,
  useRegisterReceipt,
  useCancelReceivable,
  usePayables,
  usePayablePayments,
  useCreatePayable,
  useRegisterPayment,
  useCancelPayable,
  useCashFlow,
} from "@/features/financial/hooks/useFinancial"

describe("useFinancial hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useCostCenters / useActiveCostCenters chamam o service certo", async () => {
    vi.mocked(costCenterService.list).mockResolvedValue({ data: [], total: 0 } as any)
    vi.mocked(costCenterService.listActive).mockResolvedValue([] as any)
    const { Wrapper } = createQueryWrapper()
    const { result: list } = renderHook(() => useCostCenters({ page: 1, limit: 10 }), { wrapper: Wrapper })
    const { result: active } = renderHook(() => useActiveCostCenters(), { wrapper: Wrapper })
    await waitFor(() => expect(list.current.isSuccess).toBe(true))
    await waitFor(() => expect(active.current.isSuccess).toBe(true))
  })

  it("useCreateCostCenter / useSetCostCenterActive invalidam cost-centers", async () => {
    vi.mocked(costCenterService.create).mockResolvedValue({ id: "1" } as any)
    vi.mocked(costCenterService.setActive).mockResolvedValue({ id: "1" } as any)
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")

    const { result: create } = renderHook(() => useCreateCostCenter(), { wrapper: Wrapper })
    create.current.mutate({ name: "Marketing" })
    await waitFor(() => expect(create.current.isSuccess).toBe(true))

    const { result: setActive } = renderHook(() => useSetCostCenterActive(), { wrapper: Wrapper })
    setActive.current.mutate({ id: "1", active: false })
    await waitFor(() => expect(setActive.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["cost-centers-active"] })
  })

  it("useReceivables / useReceivableReceipts (idle sem id)", async () => {
    vi.mocked(accountsReceivableService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useReceivables({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const { result: receipts } = renderHook(() => useReceivableReceipts(null), { wrapper: Wrapper })
    expect(accountsReceivableService.listReceipts).not.toHaveBeenCalled()
    expect(receipts.current.fetchStatus).toBe("idle")
  })

  it("useCreateReceivable / useRegisterReceipt / useCancelReceivable chamam o service", async () => {
    vi.mocked(accountsReceivableService.create).mockResolvedValue("id1")
    vi.mocked(accountsReceivableService.registerReceipt).mockResolvedValue({} as any)
    vi.mocked(accountsReceivableService.cancel).mockResolvedValue(undefined)
    const { Wrapper } = createQueryWrapper()

    const { result: createHook } = renderHook(() => useCreateReceivable(), { wrapper: Wrapper })
    createHook.current.mutate({ customer_id: null, cost_center_id: null, description: null, due_date: "2026-01-01", amount: 10 })
    await waitFor(() => expect(createHook.current.isSuccess).toBe(true))

    const { result: receiptHook } = renderHook(() => useRegisterReceipt(), { wrapper: Wrapper })
    receiptHook.current.mutate({ id: "id1", value: 10 })
    await waitFor(() => expect(receiptHook.current.isSuccess).toBe(true))
    expect(accountsReceivableService.registerReceipt).toHaveBeenCalledWith("id1", 10, undefined)

    const { result: cancelHook } = renderHook(() => useCancelReceivable(), { wrapper: Wrapper })
    cancelHook.current.mutate("id1")
    await waitFor(() => expect(cancelHook.current.isSuccess).toBe(true))
  })

  it("usePayables / usePayablePayments / useCreatePayable / useRegisterPayment / useCancelPayable", async () => {
    vi.mocked(accountsPayableService.list).mockResolvedValue({ data: [], total: 0 } as any)
    vi.mocked(accountsPayableService.create).mockResolvedValue("id2")
    vi.mocked(accountsPayableService.registerPayment).mockResolvedValue({} as any)
    vi.mocked(accountsPayableService.cancel).mockResolvedValue(undefined)
    const { Wrapper } = createQueryWrapper()

    const { result: list } = renderHook(() => usePayables({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(list.current.isSuccess).toBe(true))

    const { result: payments } = renderHook(() => usePayablePayments(null), { wrapper: Wrapper })
    expect(payments.current.fetchStatus).toBe("idle")

    const { result: createHook } = renderHook(() => useCreatePayable(), { wrapper: Wrapper })
    createHook.current.mutate({ supplier_id: null, cost_center_id: null, description: null, due_date: "2026-01-01", amount: 20 })
    await waitFor(() => expect(createHook.current.isSuccess).toBe(true))

    const { result: paymentHook } = renderHook(() => useRegisterPayment(), { wrapper: Wrapper })
    paymentHook.current.mutate({ id: "id2", value: 20 })
    await waitFor(() => expect(paymentHook.current.isSuccess).toBe(true))

    const { result: cancelHook } = renderHook(() => useCancelPayable(), { wrapper: Wrapper })
    cancelHook.current.mutate("id2")
    await waitFor(() => expect(cancelHook.current.isSuccess).toBe(true))
  })

  it("useCashFlow chama financialService.getCashFlow com as datas", async () => {
    vi.mocked(financialService.getCashFlow).mockResolvedValue([])
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCashFlow("2026-01-01", "2026-01-31"), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(financialService.getCashFlow).toHaveBeenCalledWith("2026-01-01", "2026-01-31")
  })
})
