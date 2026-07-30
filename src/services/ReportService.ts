import { BaseService } from "./BaseService"
import {
  AccountPayable,
  AccountReceivable,
  CashRegister,
  InventoryMovement,
  MovementType,
  Product,
  Purchase,
  PurchaseStatus,
  Sale,
  SaleStatus,
} from "@/types"

export interface ProductsReportOptions {
  active?: boolean
}

export interface InventoryReportOptions {
  startDate: string
  endDate: string
  movementType?: MovementType
}

export interface PurchasesReportOptions {
  startDate: string
  endDate: string
  status?: PurchaseStatus
}

export interface SalesReportOptions {
  startDate: string
  endDate: string
  status?: SaleStatus
}

export interface FinancialReportOptions {
  startDate: string
  endDate: string
}

export interface CashReportOptions {
  startDate: string
  endDate: string
}

export interface CustomerReportRow {
  id: string
  name: string
  document: string | null
  active: boolean
  orderCount: number
  totalSpent: number
  lastPurchaseAt: string | null
}

export interface FinancialReportResult {
  receivables: AccountReceivable[]
  payables: AccountPayable[]
  totalReceivableOpen: number
  totalPayableOpen: number
  totalReceivedInPeriod: number
  totalPaidInPeriod: number
}

// Todos os relatórios são leituras agregadas sobre tabelas já existentes
// (protegidas por RLS por empresa) — não há tabela própria de relatório,
// mesmo padrão do DashboardService (Sprint 04) e FinancialService.getCashFlow
// (Sprint 14).
export class ReportService extends BaseService {
  private static instance: ReportService

  private constructor() {
    super()
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService()
    }
    return ReportService.instance
  }

  public async getProductsReport(options: ProductsReportOptions = {}): Promise<Product[]> {
    const mockProducts = [
      {
        id: "prod-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        name: "Vinho Tinto Cabernet Sauvignon 750ml",
        sku: "VIN-CAB-001",
        category_id: "cat-1",
        sale_price: 45.0,
        purchase_price: 25.0,
        minimum_stock: 10,
        current_stock: 45,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: { name: "Vinhos Tintos" },
        brand: { name: "Concha y Toro" },
      },
      {
        id: "prod-2",
        company_id: "c1111111-1111-1111-1111-111111111111",
        name: "Cerveja IPA Artesanal 500ml",
        sku: "CER-IPA-002",
        category_id: "cat-2",
        sale_price: 18.9,
        purchase_price: 8.5,
        minimum_stock: 20,
        current_stock: 120,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: { name: "Cervejas Especiais" },
        brand: { name: "Colorado" },
      },
    ] as unknown as Product[]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      let list = this.getLocalMockStore("products", mockProducts)
      if (typeof options.active === "boolean") {
        list = list.filter((p) => p.active === options.active)
      }
      return list
    }

    try {
      let query = this.supabase
        .from("products")
        .select("*, category:categories(name), brand:brands(name)")
        .order("name", { ascending: true })

      if (typeof options.active === "boolean") {
        query = query.eq("active", options.active)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as Product[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return mockProducts
      }
      this.handleError(error)
    }
  }

  public async getInventoryReport(options: InventoryReportOptions): Promise<InventoryMovement[]> {
    const mockMovements: InventoryMovement[] = [
      {
        id: "mov-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        product_id: "prod-1",
        movement_type: "Entrada",
        quantity: 50,
        previous_quantity: 0,
        current_quantity: 50,
        reference: "NF-1002",
        observation: "Entrada de compra",
        user_id: "u1",
        created_at: new Date().toISOString(),
        product: { name: "Vinho Tinto Cabernet Sauvignon 750ml", sku: "VIN-CAB-001" },
      },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      let list = this.getLocalMockStore("inventory_movements", mockMovements)
      if (options.movementType) {
        list = list.filter((m) => m.movement_type === options.movementType)
      }
      return list
    }

    try {
      let query = this.supabase
        .from("inventory_movements")
        .select("*, product:products!inner(name, sku)")
        .gte("created_at", `${options.startDate}T00:00:00`)
        .lte("created_at", `${options.endDate}T23:59:59`)
        .order("created_at", { ascending: false })

      if (options.movementType) {
        query = query.eq("movement_type", options.movementType)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as InventoryMovement[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return mockMovements
      }
      this.handleError(error)
    }
  }

  public async getPurchasesReport(options: PurchasesReportOptions): Promise<Purchase[]> {
    const mockPurchases: Purchase[] = [
      {
        id: "pur-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        supplier_id: "sup-1",
        created_by: "u1",
        purchase_date: new Date().toISOString(),
        freight: 50.0,
        discount: 0,
        total: 1550.0,
        notes: "Compra mensal",
        status: "recebida",
        created_at: new Date().toISOString(),
        supplier: { name: "Vinícola Aurora Ltda" },
      },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      let list = this.getLocalMockStore("purchases", mockPurchases)
      if (options.status) {
        list = list.filter((p) => p.status === options.status)
      }
      return list
    }

    try {
      let query = this.supabase
        .from("purchases")
        .select("*, supplier:suppliers(name)")
        .gte("purchase_date", options.startDate)
        .lte("purchase_date", options.endDate)
        .order("purchase_date", { ascending: false })

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as Purchase[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return mockPurchases
      }
      this.handleError(error)
    }
  }

  public async getSalesReport(options: SalesReportOptions): Promise<Sale[]> {
    const mockSales = [
      {
        id: "sale-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        sale_number: 1001,
        cash_register_id: "cash-1",
        user_id: "u1",
        customer_id: "cust-1",
        sale_date: new Date().toISOString().slice(0, 10),
        subtotal: 90.0,
        discount: 0,
        total: 90.0,
        payment_method: "PIX",
        status: "finalizada",
        notes: null,
        created_at: new Date().toISOString(),
        customer: { name: "João Silva" },
      },
    ] as unknown as Sale[]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      let list = this.getLocalMockStore("sales", mockSales)
      if (options.status) {
        list = list.filter((s) => s.status === options.status)
      }
      return list
    }

    try {
      let query = this.supabase
        .from("sales")
        .select("*, customer:customers(name)")
        .gte("sale_date", options.startDate)
        .lte("sale_date", options.endDate)
        .order("sale_date", { ascending: false })

      if (options.status) {
        query = query.eq("status", options.status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data as unknown as Sale[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return mockSales
      }
      this.handleError(error)
    }
  }

  public async getFinancialReport(options: FinancialReportOptions): Promise<FinancialReportResult> {
    const mockReceivables: AccountReceivable[] = [
      {
        id: "rec-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        customer_id: "cust-1",
        sale_id: "sale-101",
        cost_center_id: "cost-1",
        description: "Venda Fiado de Vinhos",
        due_date: new Date().toISOString().slice(0, 10),
        amount: 250.0,
        received_amount: 0,
        status: "Aberta",
        created_by: "u1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        customer: { name: "João Silva" },
        cost_center: { name: "Vendas Fiado" },
      },
    ]

    const mockPayables: AccountPayable[] = [
      {
        id: "pay-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        supplier_id: "sup-1",
        purchase_id: null,
        cost_center_id: "cost-1",
        description: "Compra de Estoque Vinícola Aurora",
        due_date: new Date().toISOString().slice(0, 10),
        amount: 1500.0,
        paid_amount: 0,
        status: "Aberta",
        created_by: "u1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: { name: "Vinícola Aurora" },
        cost_center: { name: "Compras de Estoque" },
      },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      const receivables = this.getLocalMockStore("accounts_receivable", mockReceivables)
      const payables = this.getLocalMockStore("accounts_payable", mockPayables)
      return {
        receivables,
        payables,
        totalReceivableOpen: 250.0,
        totalPayableOpen: 1500.0,
        totalReceivedInPeriod: 1200.0,
        totalPaidInPeriod: 680.0,
      }
    }

    try {
      const [receivablesRes, payablesRes, receiptsRes, paymentsRes] = await Promise.all([
        this.supabase
          .from("accounts_receivable")
          .select("*, customer:customers(name), cost_center:cost_centers(name)")
          .gte("due_date", options.startDate)
          .lte("due_date", options.endDate)
          .order("due_date", { ascending: true }),
        this.supabase
          .from("accounts_payable")
          .select("*, supplier:suppliers(name), cost_center:cost_centers(name)")
          .gte("due_date", options.startDate)
          .lte("due_date", options.endDate)
          .order("due_date", { ascending: true }),
        this.supabase
          .from("receivable_receipts")
          .select("value, received_at")
          .gte("received_at", `${options.startDate}T00:00:00`)
          .lte("received_at", `${options.endDate}T23:59:59`),
        this.supabase
          .from("payable_payments")
          .select("value, paid_at")
          .gte("paid_at", `${options.startDate}T00:00:00`)
          .lte("paid_at", `${options.endDate}T23:59:59`),
      ])

      for (const res of [receivablesRes, payablesRes, receiptsRes, paymentsRes]) {
        if (res.error) throw res.error
      }

      const receivables = (receivablesRes.data as unknown as AccountReceivable[]) || []
      const payables = (payablesRes.data as unknown as AccountPayable[]) || []

      const totalReceivableOpen = receivables
        .filter((r) => r.status === "Aberta" || r.status === "Parcial")
        .reduce((sum, r) => sum + Number(r.amount) - Number(r.received_amount), 0)
      const totalPayableOpen = payables
        .filter((p) => p.status === "Aberta" || p.status === "Parcial")
        .reduce((sum, p) => sum + Number(p.amount) - Number(p.paid_amount), 0)

      const totalReceivedInPeriod = ((receiptsRes.data as { value: number }[]) || []).reduce(
        (sum, r) => sum + Number(r.value),
        0
      )
      const totalPaidInPeriod = ((paymentsRes.data as { value: number }[]) || []).reduce(
        (sum, p) => sum + Number(p.value),
        0
      )

      return { receivables, payables, totalReceivableOpen, totalPayableOpen, totalReceivedInPeriod, totalPaidInPeriod }
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return {
          receivables: mockReceivables,
          payables: mockPayables,
          totalReceivableOpen: 250.0,
          totalPayableOpen: 1500.0,
          totalReceivedInPeriod: 1200.0,
          totalPaidInPeriod: 680.0,
        }
      }
      this.handleError(error)
    }
  }

  public async getCustomersReport(): Promise<CustomerReportRow[]> {
    const mockCustomers: CustomerReportRow[] = [
      {
        id: "cust-1",
        name: "João Silva",
        document: "123.456.789-00",
        active: true,
        orderCount: 5,
        totalSpent: 450.0,
        lastPurchaseAt: new Date().toISOString().slice(0, 10),
      },
      {
        id: "cust-2",
        name: "Maria Oliveira",
        document: "987.654.321-11",
        active: true,
        orderCount: 3,
        totalSpent: 280.0,
        lastPurchaseAt: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
      },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return mockCustomers
    }

    try {
      const [customersRes, salesRes] = await Promise.all([
        this.supabase.from("customers").select("id, name, document, active").order("name", { ascending: true }),
        this.supabase.from("sales").select("customer_id, total, sale_date").eq("status", "finalizada"),
      ])
      if (customersRes.error) throw customersRes.error
      if (salesRes.error) throw salesRes.error

      const salesByCustomer = new Map<string, { total: number; count: number; last: string }>()
      for (const s of (salesRes.data as { customer_id: string | null; total: number; sale_date: string }[]) || []) {
        if (!s.customer_id) continue
        const entry = salesByCustomer.get(s.customer_id) || { total: 0, count: 0, last: s.sale_date }
        entry.total += Number(s.total)
        entry.count += 1
        if (s.sale_date > entry.last) entry.last = s.sale_date
        salesByCustomer.set(s.customer_id, entry)
      }

      return (
        (customersRes.data as { id: string; name: string; document: string | null; active: boolean }[]) || []
      ).map((c) => {
        const agg = salesByCustomer.get(c.id)
        return {
          id: c.id,
          name: c.name,
          document: c.document,
          active: c.active,
          orderCount: agg?.count || 0,
          totalSpent: agg?.total || 0,
          lastPurchaseAt: agg?.last || null,
        }
      })
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return mockCustomers
      }
      this.handleError(error)
    }
  }

  public async getCashReport(options: CashReportOptions): Promise<CashRegister[]> {
    const mockCash: CashRegister[] = [
      {
        id: "cash-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        opened_by: "u1",
        opened_at: new Date().toISOString(),
        initial_value: 200.0,
        closed_by: null,
        closed_at: null,
        final_value: null,
        difference: null,
        status: "aberto",
        opened_by_user: { name: "Administrador Teste" },
      },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return this.getLocalMockStore("cash_registers", mockCash)
    }

    try {
      const { data, error } = await this.supabase
        .from("cash_registers")
        .select("*, opened_by_user:users!cash_registers_opened_by_fkey(name)")
        .gte("opened_at", `${options.startDate}T00:00:00`)
        .lte("opened_at", `${options.endDate}T23:59:59`)
        .order("opened_at", { ascending: false })
      if (error) throw error
      return (data as unknown as CashRegister[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return mockCash
      }
      this.handleError(error)
    }
  }
}

export const reportService = ReportService.getInstance()
