import { BaseService } from "./BaseService"
import { CashRegister, CashMovement, CashMovementType } from "@/types"

export interface ListRegistersOptions {
  page: number
  limit: number
}

export interface ListRegistersResult {
  data: CashRegister[]
  total: number
}

export class CashService extends BaseService {
  private static instance: CashService

  private constructor() {
    super()
  }

  public static getInstance(): CashService {
    if (!CashService.instance) {
      CashService.instance = new CashService()
    }
    return CashService.instance
  }

  // Caixa aberto do usuário logado, se houver.
  public async getOpenRegister(): Promise<CashRegister | null> {
    const initialMock: CashRegister[] = []

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const list = this.getLocalMockStore("cash_registers", initialMock)
      return list.find((c) => c.status === "aberto") || null
    }

    try {
      const { data, error } = await this.supabase
        .from("cash_registers")
        .select("*")
        .eq("status", "aberto")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as CashRegister) ?? null
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const list = this.getLocalMockStore("cash_registers", initialMock)
        return list.find((c) => c.status === "aberto") || null
      }
      this.handleError(error, "cash.get_open_register")
    }
  }

  public async list(options: ListRegistersOptions): Promise<ListRegistersResult> {
    const initialMock: CashRegister[] = []

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const list = this.getLocalMockStore("cash_registers", initialMock)
      return { data: list, total: list.length }
    }

    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      const { data, error, count } = await this.supabase
        .from("cash_registers")
        .select("*, opened_by_user:users!cash_registers_opened_by_fkey(name)", { count: "exact" })
        .order("opened_at", { ascending: false })
        .range(from, to)
      if (error) throw error
      return { data: (data as unknown as CashRegister[]) || [], total: count || 0 }
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const list = this.getLocalMockStore("cash_registers", initialMock)
        return { data: list, total: list.length }
      }
      this.handleError(error, "cash.list")
    }
  }

  public async listMovements(cashRegisterId: string): Promise<CashMovement[]> {
    const initialMock: CashMovement[] = []

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const list = this.getLocalMockStore(`cash_movements_${cashRegisterId}`, initialMock)
      return list
    }

    try {
      const { data, error } = await this.supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", cashRegisterId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data as unknown as CashMovement[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const list = this.getLocalMockStore(`cash_movements_${cashRegisterId}`, initialMock)
        return list
      }
      this.handleError(error, "cash.list_movements")
    }
  }

  public async open(input: number | { initial_value: number; notes?: string }): Promise<string> {
    const initialValue = typeof input === "number" ? input : input.initial_value
    try {
      const { data, error } = await this.supabase.rpc("open_cash_register", {
        p_initial_value: initialValue,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "cash_registers", data as string, null, { initialValue })
      return data as string
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const id = `cash-${Date.now()}`
        const initialMock: CashRegister[] = []
        const list = this.getLocalMockStore("cash_registers", initialMock)
        const newRegister: CashRegister = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          opened_by: "u1",
          opened_at: new Date().toISOString(),
          initial_value: initialValue,
          closed_by: null,
          closed_at: null,
          final_value: null,
          difference: null,
          status: "aberto",
          opened_by_user: { name: "Administrador Teste" },
        }
        list.unshift(newRegister)
        this.saveLocalMockStore("cash_registers", list)
        return id
      }
      this.handleError(error, "cash.open")
    }
  }

  public async close(cashRegisterId: string | { final_value: number; notes?: string }, finalValueParam?: number): Promise<CashRegister> {
    let id = typeof cashRegisterId === "string" ? cashRegisterId : ""
    let finalValue = typeof cashRegisterId === "number" ? cashRegisterId : finalValueParam || 0

    if (typeof cashRegisterId === "object" && cashRegisterId !== null) {
      finalValue = cashRegisterId.final_value
      const openReg = await this.getOpenRegister()
      id = openReg ? openReg.id : `cash-${Date.now()}`
    }

    try {
      const { data, error } = await this.supabase.rpc("close_cash_register", {
        p_cash_register_id: id,
        p_final_value: finalValue,
      })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "cash_registers", id, null, { action: "close", finalValue })
      return data as unknown as CashRegister
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: CashRegister[] = []
        const list = this.getLocalMockStore("cash_registers", initialMock)
        const idx = list.findIndex((c) => c.id === id)
        if (idx !== -1) {
          list[idx].status = "fechado"
          list[idx].closed_by = "u1"
          list[idx].closed_at = new Date().toISOString()
          list[idx].final_value = finalValue
          list[idx].difference = finalValue - list[idx].initial_value
          this.saveLocalMockStore("cash_registers", list)
          return list[idx]
        }
        const mockClosed: CashRegister = {
          id: id || `cash-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          opened_by: "u1",
          opened_at: new Date().toISOString(),
          initial_value: 200.00,
          closed_by: "u1",
          closed_at: new Date().toISOString(),
          final_value: finalValue,
          difference: finalValue - 200.00,
          status: "fechado",
        }
        return mockClosed
      }
      this.handleError(error, "cash.close")
    }
  }

  public async registerMovement(
    cashRegisterId: string,
    movementType: Extract<CashMovementType, "Sangria" | "Suprimento">,
    value: number,
    description?: string | null
  ): Promise<CashMovement> {
    try {
      const { data, error } = await this.supabase.rpc("register_cash_movement", {
        p_cash_register_id: cashRegisterId,
        p_movement_type: movementType,
        p_value: value,
        p_description: description || null,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "cash_movements", (data as CashMovement).id, null, {
        movementType,
        value,
      })
      return data as unknown as CashMovement
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const newMov: CashMovement = {
          id: `cm-${Date.now()}`,
          cash_register_id: cashRegisterId,
          movement_type: movementType,
          value,
          description: description || null,
          user_id: "u1",
          created_at: new Date().toISOString(),
        }
        const list = this.getLocalMockStore<CashMovement>(`cash_movements_${cashRegisterId}`, [])
        list.unshift(newMov)
        this.saveLocalMockStore(`cash_movements_${cashRegisterId}`, list)
        return newMov
      }
      this.handleError(error, "cash.register_movement")
    }
  }
  public async getCurrent(): Promise<{ id: string; initial_value: number; current_balance: number; status: string } | null> {
    const openReg = await this.getOpenRegister()
    if (!openReg) return null

    const movements = await this.listMovements(openReg.id)
    let balance = Number(openReg.initial_value || 0)

    for (const m of movements) {
      if (m.movement_type === "Entrada" || m.movement_type === "Suprimento") {
        balance += Number(m.value || 0)
      } else if (m.movement_type === "Saída" || m.movement_type === "Sangria") {
        balance -= Number(m.value || 0)
      }
    }

    return {
      id: openReg.id,
      initial_value: Number(openReg.initial_value || 0),
      current_balance: balance,
      status: openReg.status,
    }
  }
}

export const cashService = CashService.getInstance()
