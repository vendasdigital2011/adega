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
      this.handleError(error)
    }
  }

  public async list(options: ListRegistersOptions): Promise<ListRegistersResult> {
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
      this.handleError(error)
    }
  }

  public async listMovements(cashRegisterId: string): Promise<CashMovement[]> {
    try {
      const { data, error } = await this.supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_register_id", cashRegisterId)
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data as unknown as CashMovement[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async open(initialValue: number): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc("open_cash_register", {
        p_initial_value: initialValue,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "cash_registers", data as string, null, { initialValue })
      return data as string
    } catch (error) {
      this.handleError(error)
    }
  }

  public async close(cashRegisterId: string, finalValue: number): Promise<CashRegister> {
    try {
      const { data, error } = await this.supabase.rpc("close_cash_register", {
        p_cash_register_id: cashRegisterId,
        p_final_value: finalValue,
      })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "cash_registers", cashRegisterId, null, { action: "close", finalValue })
      return data as unknown as CashRegister
    } catch (error) {
      this.handleError(error)
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
      this.handleError(error)
    }
  }
}

export const cashService = CashService.getInstance()
