import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createQueryWrapper } from "./helpers/queryWrapper"

vi.mock("@/services/CashService", () => ({
  cashService: {
    getOpenRegister: vi.fn(),
    list: vi.fn(),
    listMovements: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    registerMovement: vi.fn(),
  },
}))

import { cashService } from "@/services/CashService"
import {
  useOpenRegister,
  useRegisters,
  useRegisterMovements,
  useOpenCash,
  useCloseCash,
  useRegisterCashMovement,
} from "@/features/cash/hooks/useCash"

describe("useCash hooks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("useOpenRegister busca o caixa aberto atual", async () => {
    vi.mocked(cashService.getOpenRegister).mockResolvedValue(null)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useOpenRegister(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it("useRegisters chama cashService.list", async () => {
    vi.mocked(cashService.list).mockResolvedValue({ data: [], total: 0 } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useRegisters({ page: 1, limit: 10 }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cashService.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
  })

  it("useRegisterMovements fica idle sem cashRegisterId", () => {
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useRegisterMovements(null), { wrapper: Wrapper })
    expect(cashService.listMovements).not.toHaveBeenCalled()
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("useOpenCash chama cashService.open e invalida o estado do caixa", async () => {
    vi.mocked(cashService.open).mockResolvedValue("reg-1")
    const { Wrapper, queryClient } = createQueryWrapper()
    const spy = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useOpenCash(), { wrapper: Wrapper })
    result.current.mutate(100)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cashService.open).toHaveBeenCalledWith(100)
    expect(spy).toHaveBeenCalledWith({ queryKey: ["cash-open-register"] })
  })

  it("useCloseCash repassa id e finalValue", async () => {
    vi.mocked(cashService.close).mockResolvedValue({ id: "reg-1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useCloseCash(), { wrapper: Wrapper })
    result.current.mutate({ id: "reg-1", finalValue: 150 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cashService.close).toHaveBeenCalledWith("reg-1", 150)
  })

  it("useRegisterCashMovement repassa todos os parâmetros", async () => {
    vi.mocked(cashService.registerMovement).mockResolvedValue({ id: "m1" } as any)
    const { Wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useRegisterCashMovement(), { wrapper: Wrapper })
    result.current.mutate({ cashRegisterId: "reg-1", movementType: "Sangria", value: 30, description: "retirada" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cashService.registerMovement).toHaveBeenCalledWith("reg-1", "Sangria", 30, "retirada")
  })
})
