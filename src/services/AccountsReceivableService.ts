import { BaseService } from "./BaseService"
import { AccountReceivable, AccountsReceivableStatus, ReceivableReceipt } from "@/types"

export interface CreateReceivableInput {
  customer_id: string | null
  cost_center_id: string | null
  description: string | null
  due_date: string
  amount: number
}

export interface ListReceivablesOptions {
  status?: AccountsReceivableStatus
  page: number
  limit: number
}

export interface ListReceivablesResult {
  data: AccountReceivable[]
  total: number
}

export class AccountsReceivableService extends BaseService {
  private static instance: AccountsReceivableService

  private constructor() {
    super()
  }

  public static getInstance(): AccountsReceivableService {
    if (!AccountsReceivableService.instance) {
      AccountsReceivableService.instance = new AccountsReceivableService()
    }
    return AccountsReceivableService.instance
  }

  public async list(options: ListReceivablesOptions): Promise<ListReceivablesResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("accounts_receivable")
        .select("*, customer:customers(name), cost_center:cost_centers(name)", { count: "exact" })
        .order("due_date", { ascending: true })
        .range(from, to)

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as unknown as AccountReceivable[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async listReceipts(accountsReceivableId: string): Promise<ReceivableReceipt[]> {
    try {
      const { data, error } = await this.supabase
        .from("receivable_receipts")
        .select("*")
        .eq("accounts_receivable_id", accountsReceivableId)
        .order("received_at", { ascending: false })
      if (error) throw error
      return (data as unknown as ReceivableReceipt[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateReceivableInput): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc("create_receivable", {
        p_customer_id: input.customer_id,
        p_cost_center_id: input.cost_center_id,
        p_description: input.description,
        p_due_date: input.due_date,
        p_amount: input.amount,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "accounts_receivable", data as string, null, input)
      return data as string
    } catch (error) {
      this.handleError(error)
    }
  }

  public async registerReceipt(
    accountsReceivableId: string,
    value: number,
    description?: string | null
  ): Promise<AccountReceivable> {
    try {
      const { data, error } = await this.supabase.rpc("register_receipt", {
        p_accounts_receivable_id: accountsReceivableId,
        p_value: value,
        p_description: description || null,
      })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "accounts_receivable", accountsReceivableId, null, {
        action: "receipt",
        value,
      })
      return data as unknown as AccountReceivable
    } catch (error) {
      this.handleError(error)
    }
  }

  public async cancel(accountsReceivableId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("cancel_receivable", {
        p_accounts_receivable_id: accountsReceivableId,
      })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "accounts_receivable", accountsReceivableId, null, { action: "cancel" })
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const accountsReceivableService = AccountsReceivableService.getInstance()
