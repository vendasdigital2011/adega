import { describe, it, expect, beforeAll } from "vitest"
import { cashService } from "@/services/CashService"
import { loginAppClientAs } from "./helpers/appAuth"
import { signInAs } from "./helpers/testClient"

describe("CashService (integração)", () => {
  let registerId: string

  beforeAll(async () => {
    await loginAppClientAs("admin")
    // Garante estado limpo: fecha qualquer caixa deixado aberto por um teste
    // anterior (a empresa de teste só tem uma, e só cabe um caixa aberto por
    // usuário) antes de rodar a suíte.
    const existing = await cashService.getOpenRegister()
    if (existing) {
      await cashService.close(existing.id, existing.initial_value)
    }
  })

  it("não há caixa aberto no início", async () => {
    const open = await cashService.getOpenRegister()
    expect(open).toBeNull()
  })

  it("abre um caixa com valor inicial", async () => {
    registerId = await cashService.open(100)
    expect(registerId).toBeTruthy()
    const open = await cashService.getOpenRegister()
    expect(open?.id).toBe(registerId)
    expect(open?.status).toBe("aberto")
  })

  it("bloqueia abrir um segundo caixa enquanto o primeiro está aberto", async () => {
    await expect(cashService.open(50)).rejects.toBeTruthy()
  })

  it("Sangria e Suprimento ficam no histórico de movimentações", async () => {
    await cashService.registerMovement(registerId, "Suprimento", 50, "reforço de caixa")
    await cashService.registerMovement(registerId, "Sangria", 30, "retirada")
    const movements = await cashService.listMovements(registerId)
    expect(movements.some((m) => m.movement_type === "Suprimento" && m.value === 50)).toBe(true)
    expect(movements.some((m) => m.movement_type === "Sangria" && m.value === 30)).toBe(true)
  })

  it("fecha o caixa e calcula a diferença contra o saldo esperado", async () => {
    // esperado = 100 (inicial) + 50 (suprimento) - 30 (sangria) = 120
    const closed = await cashService.close(registerId, 120)
    expect(closed.status).toBe("fechado")
    expect(closed.difference).toBe(0)
  })

  it("depois de fechado, getOpenRegister volta a null", async () => {
    const open = await cashService.getOpenRegister()
    expect(open).toBeNull()
  })

  it("RLS: vendedor sem cash.manage não consegue abrir caixa", async () => {
    const vendedor = await signInAs("vendedor")
    const { error } = await vendedor.rpc("open_cash_register", { p_initial_value: 10 })
    expect(error).toBeTruthy()
  })

  it("list() retorna o histórico com o nome de quem abriu", async () => {
    const result = await cashService.list({ page: 1, limit: 5 })
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data[0].opened_by_user?.name).toBeTruthy()
  })
})
