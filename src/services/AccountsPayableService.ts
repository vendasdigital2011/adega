import { BaseService } from "./BaseService"
import { AccountPayable, AccountsPayableStatus, PayablePayment } from "@/types"

export interface CreatePayableInput {
  supplier_id: string | null
  cost_center_id: string | null
  description: string | null
  due_date: string
  amount: number
}

export interface ListPayablesOptions {
  status?: AccountsPayableStatus
  page: number
  limit: number
}

export interface ListPayablesResult {
  data: AccountPayable[]
  total: number
}

export class AccountsPayableService extends BaseService {
  private static instance: AccountsPayableService

  private constructor() {
    super()
  }

  public static getInstance(): AccountsPayableService {
    if (!AccountsPayableService.instance) {
      AccountsPayableService.instance = new AccountsPayableService()
    }
    return AccountsPayableService.instance
  }

  public async list(options: ListPayablesOptions): Promise<ListPayablesResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("accounts_payable")
        .select("*, supplier:suppliers(name), cost_center:cost_centers(name)", { count: "exact" })
        .order("due_date", { ascending: true })
        .range(from, to)

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as unknown as AccountPayable[]) || [], total: count || 0 }
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const mockPayables: AccountPayable[] = [
          {
            id: "pay-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            supplier_id: "sup-1",
            purchase_id: null,
            cost_center_id: "cost-1",
            description: "Compra de Estoque Vinícola Aurora",
            due_date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
            amount: 1500.00,
            paid_amount: 0,
            status: "Aberta",
            created_by: "u1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            supplier: { name: "Vinícola Aurora" },
            cost_center: { name: "Compras de Estoque" },
          },
          {
            id: "pay-2",
            company_id: "c1111111-1111-1111-1111-111111111111",
            supplier_id: "sup-2",
            purchase_id: null,
            cost_center_id: "cost-2",
            description: "Fatura de Energia Elétrica",
            due_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
            amount: 480.50,
            paid_amount: 480.50,
            status: "Paga",
            created_by: "u1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            supplier: { name: "Enel Distribuição" },
            cost_center: { name: "Despesas Operacionais" },
          },
        ]
        return { data: mockPayables, total: mockPayables.length }
      }
      this.handleError(error, "accounts_payable.list")
    }
  }

  public async listPayments(accountsPayableId: string): Promise<PayablePayment[]> {
    try {
      const { data, error } = await this.supabase
        .from("payable_payments")
        .select("*")
        .eq("accounts_payable_id", accountsPayableId)
        .order("paid_at", { ascending: false })
      if (error) throw error
      return (data as unknown as PayablePayment[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) return []
      this.handleError(error, "accounts_payable.list_payments")
    }
  }

  public async create(input: CreatePayableInput): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc("create_payable", {
        p_supplier_id: input.supplier_id,
        p_cost_center_id: input.cost_center_id,
        p_description: input.description,
        p_due_date: input.due_date,
        p_amount: input.amount,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "accounts_payable", data as string, null, input)
      return data as string
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return `pay-${Date.now()}`
      }
      this.handleError(error, "accounts_payable.create")
    }
  }

  public async registerPayment(
    accountsPayableId: string,
    value: number,
    description?: string | null
  ): Promise<AccountPayable> {
    try {
      const { data, error } = await this.supabase.rpc("register_payment", {
        p_accounts_payable_id: accountsPayableId,
        p_value: value,
        p_description: description || null,
      })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "accounts_payable", accountsPayableId, null, {
        action: "payment",
        value,
      })
      return data as unknown as AccountPayable
    } catch (error) {
      this.handleError(error)
    }
  }

  public async cancel(accountsPayableId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("cancel_payable", {
        p_accounts_payable_id: accountsPayableId,
      })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "accounts_payable", accountsPayableId, null, { action: "cancel" })
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const accountsPayableService = AccountsPayableService.getInstance()
