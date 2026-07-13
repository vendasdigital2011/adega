import { BaseService } from "./BaseService"
import { Purchase, PurchaseItem, PurchaseStatus } from "@/types"

export interface PurchaseItemInput {
  product_id: string
  quantity: number
  unit_price: number
}

export interface CreatePurchaseInput {
  supplier_id: string
  purchase_date: string
  freight: number
  discount: number
  notes?: string | null
  items: PurchaseItemInput[]
}

export interface ListPurchasesOptions {
  status?: PurchaseStatus
  page: number
  limit: number
}

export interface ListPurchasesResult {
  data: Purchase[]
  total: number
}

export class PurchaseService extends BaseService {
  private static instance: PurchaseService

  private constructor() {
    super()
  }

  public static getInstance(): PurchaseService {
    if (!PurchaseService.instance) {
      PurchaseService.instance = new PurchaseService()
    }
    return PurchaseService.instance
  }

  public async list(options: ListPurchasesOptions): Promise<ListPurchasesResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("purchases")
        .select("*, supplier:suppliers(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as unknown as Purchase[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async getItems(purchaseId: string): Promise<PurchaseItem[]> {
    try {
      const { data, error } = await this.supabase
        .from("purchase_items")
        .select("*, product:products(name, sku)")
        .eq("purchase_id", purchaseId)
      if (error) throw error
      return (data as unknown as PurchaseItem[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreatePurchaseInput): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc("create_purchase", {
        p_supplier_id: input.supplier_id,
        p_purchase_date: input.purchase_date,
        p_freight: input.freight,
        p_discount: input.discount,
        p_notes: input.notes || null,
        p_items: input.items,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "purchases", data as string, null, input)
      return data as string
    } catch (error) {
      this.handleError(error)
    }
  }

  public async receive(purchaseId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("receive_purchase", { p_purchase_id: purchaseId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "purchases", purchaseId, null, { action: "receive" })
    } catch (error) {
      this.handleError(error)
    }
  }

  public async cancel(purchaseId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("cancel_purchase", { p_purchase_id: purchaseId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "purchases", purchaseId, null, { action: "cancel" })
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const purchaseService = PurchaseService.getInstance()
