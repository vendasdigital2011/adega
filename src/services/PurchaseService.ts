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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Purchase[] = [
          {
            id: "pur-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            supplier_id: "sup-1",
            created_by: "u1",
            purchase_date: new Date().toISOString(),
            freight: 50.00,
            discount: 0,
            total: 1550.00,
            notes: "Compra de reposição mensal de vinhos",
            status: "recebida",
            created_at: new Date().toISOString(),
            supplier: { name: "Vinícola Aurora Ltda" },
          },
        ]
        let items = this.getLocalMockStore("purchases", initialMock)
        if (options.status) {
          items = items.filter((p) => p.status === options.status)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "purchases.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        return [
          {
            id: "pi-1",
            purchase_id: purchaseId,
            product_id: "prod-1",
            quantity: 60,
            unit_price: 25.00,
            total: 1500.00,
            product: { name: "Vinho Tinto Cabernet Sauvignon 750ml", sku: "VIN-CAB-001" },
          },
        ]
      }
      this.handleError(error, "purchases.get_items")
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
      if (this.isOfflineOrDemoMode(error)) {
        const id = `pur-${Date.now()}`
        const initialMock: Purchase[] = [
          {
            id: "pur-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            supplier_id: "sup-1",
            created_by: "u1",
            purchase_date: new Date().toISOString(),
            freight: 50.00,
            discount: 0,
            total: 1550.00,
            notes: "Compra de reposição mensal de vinhos",
            status: "recebida",
            created_at: new Date().toISOString(),
            supplier: { name: "Vinícola Aurora Ltda" },
          },
        ]
        const list = this.getLocalMockStore("purchases", initialMock)
        const totalItems = input.items.reduce((acc, item) => acc + item.quantity * item.unit_price, 0)
        const newPurchase: Purchase = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          supplier_id: input.supplier_id,
          created_by: "u1",
          purchase_date: input.purchase_date || new Date().toISOString(),
          freight: input.freight || 0,
          discount: input.discount || 0,
          total: totalItems + (input.freight || 0) - (input.discount || 0),
          notes: input.notes || null,
          status: "pendente",
          created_at: new Date().toISOString(),
        }
        list.unshift(newPurchase)
        this.saveLocalMockStore("purchases", list)
        return id
      }
      this.handleError(error, "purchases.create")
    }
  }

  public async receive(purchaseId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("receive_purchase", { p_purchase_id: purchaseId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "purchases", purchaseId, null, { action: "receive" })
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Purchase[] = []
        const list = this.getLocalMockStore("purchases", initialMock)
        const idx = list.findIndex((p) => p.id === purchaseId)
        if (idx !== -1) {
          list[idx].status = "recebida"
          this.saveLocalMockStore("purchases", list)
        }
        return
      }
      this.handleError(error, "purchases.receive")
    }
  }

  public async cancel(purchaseId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("cancel_purchase", { p_purchase_id: purchaseId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "purchases", purchaseId, null, { action: "cancel" })
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Purchase[] = []
        const list = this.getLocalMockStore("purchases", initialMock)
        const idx = list.findIndex((p) => p.id === purchaseId)
        if (idx !== -1) {
          list[idx].status = "cancelada"
          this.saveLocalMockStore("purchases", list)
        }
        return
      }
      this.handleError(error, "purchases.cancel")
    }
  }
}

export const purchaseService = PurchaseService.getInstance()
