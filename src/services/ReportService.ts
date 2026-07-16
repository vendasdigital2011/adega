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
      this.handleError(error)
    }
  }

  public async getInventoryReport(options: InventoryReportOptions): Promise<InventoryMovement[]> {
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
      this.handleError(error)
    }
  }

  public async getPurchasesReport(options: PurchasesReportOptions): Promise<Purchase[]> {
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
      this.handleError(error)
    }
  }

  public async getSalesReport(options: SalesReportOptions): Promise<Sale[]> {
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
      this.handleError(error)
    }
  }

  public async getFinancialReport(options: FinancialReportOptions): Promise<FinancialReportResult> {
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
      this.handleError(error)
    }
  }

  public async getCustomersReport(): Promise<CustomerReportRow[]> {
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
      this.handleError(error)
    }
  }

  public async getCashReport(options: CashReportOptions): Promise<CashRegister[]> {
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
      this.handleError(error)
    }
  }
}

export const reportService = ReportService.getInstance()
