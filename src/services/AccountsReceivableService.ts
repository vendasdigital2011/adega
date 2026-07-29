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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: AccountReceivable[] = [
          {
            id: "rec-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            customer_id: "cust-1",
            sale_id: "sale-101",
            cost_center_id: "cost-1",
            description: "Venda Fiado de Vinhos",
            due_date: new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10),
            amount: 250.00,
            received_amount: 0,
            status: "Aberta",
            created_by: "u1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            customer: { name: "João Silva" },
            cost_center: { name: "Vendas Fiado" },
          },
        ]
        let items = this.getLocalMockStore("accounts_receivable", initialMock)
        if (options.status) {
          items = items.filter((r) => r.status === options.status)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "accounts_receivable.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        return []
      }
      this.handleError(error, "accounts_receivable.list_receipts")
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
      if (this.isOfflineOrDemoMode(error)) {
        const id = `rec-${Date.now()}`
        const initialMock: AccountReceivable[] = [
          {
            id: "rec-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            customer_id: "cust-1",
            sale_id: "sale-101",
            cost_center_id: "cost-1",
            description: "Venda Fiado de Vinhos",
            due_date: new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10),
            amount: 250.00,
            received_amount: 0,
            status: "Aberta",
            created_by: "u1",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            customer: { name: "João Silva" },
            cost_center: { name: "Vendas Fiado" },
          },
        ]
        const list = this.getLocalMockStore("accounts_receivable", initialMock)
        const newRec: AccountReceivable = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          customer_id: input.customer_id,
          sale_id: null,
          cost_center_id: input.cost_center_id,
          description: input.description,
          due_date: input.due_date,
          amount: input.amount,
          received_amount: 0,
          status: "Aberta",
          created_by: "u1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newRec)
        this.saveLocalMockStore("accounts_receivable", list)
        return id
      }
      this.handleError(error, "accounts_receivable.create")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: AccountReceivable[] = []
        const list = this.getLocalMockStore("accounts_receivable", initialMock)
        const idx = list.findIndex((r) => r.id === accountsReceivableId)
        if (idx !== -1) {
          list[idx].received_amount = (list[idx].received_amount || 0) + value
          if (list[idx].received_amount >= list[idx].amount) {
            list[idx].status = "Recebida"
          } else {
            list[idx].status = "Parcial"
          }
          this.saveLocalMockStore("accounts_receivable", list)
          return list[idx]
        }
        const mockRec: AccountReceivable = {
          id: accountsReceivableId,
          company_id: "c1111111-1111-1111-1111-111111111111",
          customer_id: "cust-1",
          sale_id: null,
          cost_center_id: null,
          description: description || "Recebimento",
          due_date: new Date().toISOString().slice(0, 10),
          amount: value,
          received_amount: value,
          status: "Recebida",
          created_by: "u1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        return mockRec
      }
      this.handleError(error, "accounts_receivable.register_receipt")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: AccountReceivable[] = []
        const list = this.getLocalMockStore("accounts_receivable", initialMock)
        const idx = list.findIndex((r) => r.id === accountsReceivableId)
        if (idx !== -1) {
          list[idx].status = "Cancelada"
          this.saveLocalMockStore("accounts_receivable", list)
        }
        return
      }
      this.handleError(error, "accounts_receivable.cancel")
    }
  }
}

export const accountsReceivableService = AccountsReceivableService.getInstance()
