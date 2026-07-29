import { BaseService } from "./BaseService"
import { Sale, SaleItem, SaleStatus, PaymentMethod } from "@/types"
import { cacheService } from "./cache/CacheService"
import { CacheKeys } from "./cache/CacheKeys"

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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Sale[] = [
          {
            id: "sale-101",
            company_id: "c1111111-1111-1111-1111-111111111111",
            customer_id: "cust-1",
            created_by: "u1",
            sale_date: new Date().toISOString(),
            subtotal: 99.80,
            discount: 0,
            total: 99.80,
            payment_method: "Cartão de Crédito",
            status: "finalizada",
            created_at: new Date().toISOString(),
            customer: { name: "João Silva" },
          },
        ]
        let items = this.getLocalMockStore("sales", initialMock)
        if (options.status) {
          items = items.filter((s) => s.status === options.status)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "sales.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        return [
          {
            id: "si-1",
            sale_id: saleId,
            product_id: "prod-1",
            quantity: 2,
            unit_price: 49.90,
            total: 99.80,
            product: { name: "Vinho Tinto Cabernet Sauvignon 750ml", sku: "VIN-CAB-001" },
          },
        ]
      }
      this.handleError(error, "sales.get_items")
    }
  }

  public async create(input: CreateSaleInput): Promise<string> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase.rpc("create_sale", {
        p_customer_id: input.customer_id,
        p_sale_date: input.sale_date,
        p_discount: input.discount,
        p_payment_method: input.payment_method,
        p_items: input.items,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "sales", data as string, null, input)
      await cacheService.invalidate(CacheKeys.dashboard(companyId))
      return data as string
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const companyId = "c1111111-1111-1111-1111-111111111111"
        const id = `sale-${Date.now()}`
        const initialMock: Sale[] = [
          {
            id: "sale-101",
            company_id: companyId,
            customer_id: "cust-1",
            created_by: "u1",
            sale_date: new Date().toISOString(),
            subtotal: 99.80,
            discount: 0,
            total: 99.80,
            payment_method: "Cartão de Crédito",
            status: "finalizada",
            created_at: new Date().toISOString(),
            customer: { name: "João Silva" },
          },
        ]
        const list = this.getLocalMockStore("sales", initialMock)
        const newSale: Sale = {
          id,
          company_id: companyId,
          customer_id: input.customer_id,
          created_by: "u1",
          sale_date: input.sale_date || new Date().toISOString(),
          subtotal: 100.00,
          discount: input.discount || 0,
          total: 100.00 - (input.discount || 0),
          payment_method: input.payment_method,
          status: "finalizada",
          created_at: new Date().toISOString(),
        }
        list.unshift(newSale)
        this.saveLocalMockStore("sales", list)
        await cacheService.invalidate(CacheKeys.dashboard(companyId))
        return id
      }
      this.handleError(error, "sales.create")
    }
  }

  public async cancel(saleId: string): Promise<void> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { error } = await this.supabase.rpc("cancel_sale", { p_sale_id: saleId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "sales", saleId, null, { action: "cancel" })
      await cacheService.invalidate(CacheKeys.dashboard(companyId))
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const companyId = "c1111111-1111-1111-1111-111111111111"
        const initialMock: Sale[] = []
        const list = this.getLocalMockStore("sales", initialMock)
        const idx = list.findIndex((s) => s.id === saleId)
        if (idx !== -1) {
          list[idx].status = "cancelada"
          this.saveLocalMockStore("sales", list)
        }
        await cacheService.invalidate(CacheKeys.dashboard(companyId))
        return
      }
      this.handleError(error, "sales.cancel")
    }
  }
}

export const saleService = SaleService.getInstance()
