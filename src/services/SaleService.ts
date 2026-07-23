import { BaseService } from "./BaseService"
import { Sale, SaleItem, SaleStatus, PaymentMethod } from "@/types"

// unit_price não é enviado: o servidor resolve o preço a partir do catálogo
// (ver migration 0021 — nunca confia em preço vindo do cliente).
export interface SaleItemInput {
  product_id: string
  quantity: number
}

export interface CreateSaleInput {
  customer_id: string | null
  sale_date: string
  discount: number
  payment_method: PaymentMethod
  items: SaleItemInput[]
}

export interface ListSalesOptions {
  status?: SaleStatus
  page: number
  limit: number
}

export interface ListSalesResult {
  data: Sale[]
  total: number
}

export class SaleService extends BaseService {
  private static instance: SaleService

  private constructor() {
    super()
  }

  public static getInstance(): SaleService {
    if (!SaleService.instance) {
      SaleService.instance = new SaleService()
    }
    return SaleService.instance
  }

  public async list(options: ListSalesOptions): Promise<ListSalesResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("sales")
        .select("*, customer:customers(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as unknown as Sale[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async getItems(saleId: string): Promise<SaleItem[]> {
    try {
      const { data, error } = await this.supabase
        .from("sale_items")
        .select("*, product:products(name, sku)")
        .eq("sale_id", saleId)
      if (error) throw error
      return (data as unknown as SaleItem[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateSaleInput): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc("create_sale", {
        p_customer_id: input.customer_id,
        p_sale_date: input.sale_date,
        p_discount: input.discount,
        p_payment_method: input.payment_method,
        p_items: input.items,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "sales", data as string, null, input)
      return data as string
    } catch (error) {
      this.handleError(error)
    }
  }

  public async cancel(saleId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("cancel_sale", { p_sale_id: saleId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "sales", saleId, null, { action: "cancel" })
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const saleService = SaleService.getInstance()
