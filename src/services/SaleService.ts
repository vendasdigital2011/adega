import { BaseService } from "./BaseService"
import { Sale, SaleItem, SaleStatus, PaymentMethod, Product } from "@/types"
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
      {
        id: "sale-102",
        company_id: "c1111111-1111-1111-1111-111111111111",
        customer_id: "cust-2",
        created_by: "u1",
        sale_date: new Date().toISOString(),
        subtotal: 45.00,
        discount: 0,
        total: 45.00,
        payment_method: "PIX",
        status: "finalizada",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        customer: { name: "Maria Oliveira" },
      },
    ]

    if (this.isOfflineOrDemoMode()) {
      let list = this.getLocalMockStore("sales", initialMock)
      if (options.status) {
        list = list.filter((s) => s.status === options.status)
      }
      const total = list.length
      const from = (options.page - 1) * options.limit
      const pagedData = list.slice(from, from + options.limit)
      return { data: pagedData, total }
    }

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
    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const companyId = "c1111111-1111-1111-1111-111111111111"
      const initialProducts = [
        {
          id: "prod-1",
          company_id: companyId,
          name: "Vinho Tinto Cabernet Sauvignon 750ml",
          sku: "VIN-CAB-001",
          sale_price: 45.0,
          current_stock: 45,
          active: true,
        },
        {
          id: "prod-2",
          company_id: companyId,
          name: "Cerveja IPA Artesanal 500ml",
          sku: "CER-IPA-002",
          sale_price: 18.9,
          current_stock: 120,
          active: true,
        },
      ]
      const products: Product[] = this.getLocalMockStore("products", initialProducts as unknown as Product[])

      // Validação de estoque suficiente para todos os itens
      for (const item of input.items) {
        const p = products.find((prod: { id: string }) => prod.id === item.product_id)
        const stock = p ? p.current_stock : 0
        if (stock < item.quantity) {
          throw new Error("Estoque insuficiente para concluir esta venda.")
        }
      }

      // Cálculo do subtotal dinâmico com base nos produtos e preços
      let subtotal = 0
      const saleItems: SaleItem[] = []

      for (const item of input.items) {
        const p = products.find((prod: { id: string }) => prod.id === item.product_id)
        const unitPrice = p ? (p.promotion_price ?? p.sale_price) : 45.0
        const itemTotal = unitPrice * item.quantity
        subtotal += itemTotal

        // Baixa do estoque
        if (p) {
          p.current_stock -= item.quantity
          p.updated_at = new Date().toISOString()
        }

        saleItems.push({
          id: `si-${Date.now()}-${item.product_id}`,
          sale_id: "",
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total: itemTotal,
          product: p ? { name: p.name, sku: p.sku } : null,
        })
      }
      this.saveLocalMockStore("products", products)

      const discount = input.discount || 0
      const total = Math.max(0, subtotal - discount)

      const customers = this.getLocalMockStore("customers", [
        { id: "cust-1", name: "João Silva" },
        { id: "cust-2", name: "Maria Oliveira" },
      ])
      const foundCust = customers.find((c: { id: string; name: string }) => c.id === input.customer_id)

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
        subtotal,
        discount,
        total,
        payment_method: input.payment_method,
        status: "finalizada",
        created_at: new Date().toISOString(),
        customer: foundCust ? { name: foundCust.name } : null,
      }
      list.unshift(newSale)
      this.saveLocalMockStore("sales", list)

      // Atualiza os sale_items vinculando o id da venda gerado
      for (const si of saleItems) {
        si.sale_id = id
      }
      this.saveLocalMockStore(`sale_items_${id}`, saleItems)

      await cacheService.invalidate(CacheKeys.dashboard(companyId))
      return id
    }

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
        const products: Product[] = this.getLocalMockStore("products", [])

        for (const item of input.items) {
          const p = products.find((prod: { id: string }) => prod.id === item.product_id)
          const stock = p ? p.current_stock : 0
          if (stock < item.quantity) {
            throw new Error("Estoque insuficiente para concluir esta venda.")
          }
        }

        let subtotal = 0
        for (const item of input.items) {
          const p = products.find((prod: { id: string }) => prod.id === item.product_id)
          const unitPrice = p ? (p.promotion_price ?? p.sale_price) : 45.0
          subtotal += unitPrice * item.quantity
          if (p) p.current_stock -= item.quantity
        }
        this.saveLocalMockStore("products", products)

        const discount = input.discount || 0
        const total = Math.max(0, subtotal - discount)
        const id = `sale-${Date.now()}`
        const initialMock: Sale[] = []
        const list = this.getLocalMockStore("sales", initialMock)
        const newSale: Sale = {
          id,
          company_id: companyId,
          customer_id: input.customer_id,
          created_by: "u1",
          sale_date: input.sale_date || new Date().toISOString(),
          subtotal,
          discount,
          total,
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
