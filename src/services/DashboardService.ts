import { BaseService } from "./BaseService"
import { SaleStatus } from "@/types"

export interface DashboardRecentSale {
  id: string
  customerName: string | null
  total: number
  status: SaleStatus
  createdAt: string
}

export interface DashboardSummary {
  todayTotal: number
  yesterdayTotal: number
  todayOrders: number
  yesterdayOrders: number
  newCustomersToday: number
  newCustomersYesterday: number
  totalCustomers: number
  lowStockCount: number
  recentSales: DashboardRecentSale[]
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export class DashboardService extends BaseService {
  private static instance: DashboardService

  private constructor() {
    super()
  }

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService()
    }
    return DashboardService.instance
  }

  public async getSummary(): Promise<DashboardSummary> {
    try {
      const now = new Date()
      const todayStr = toDateStr(now)

      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = toDateStr(yesterday)

      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const tomorrowStart = new Date(todayStart)
      tomorrowStart.setDate(tomorrowStart.getDate() + 1)
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)

      const [
        todaySalesRes,
        yesterdaySalesRes,
        newCustomersTodayRes,
        newCustomersYesterdayRes,
        totalCustomersRes,
        productsRes,
        recentRes,
      ] = await Promise.all([
        this.supabase.from("sales").select("total").eq("sale_date", todayStr).eq("status", "finalizada"),
        this.supabase.from("sales").select("total").eq("sale_date", yesterdayStr).eq("status", "finalizada"),
        this.supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart.toISOString())
          .lt("created_at", tomorrowStart.toISOString()),
        this.supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .gte("created_at", yesterdayStart.toISOString())
          .lt("created_at", todayStart.toISOString()),
        this.supabase.from("customers").select("id", { count: "exact", head: true }),
        this.supabase.from("products").select("current_stock, minimum_stock").eq("active", true),
        this.supabase
          .from("sales")
          .select("id, total, status, created_at, customer:customers(name)")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      for (const res of [
        todaySalesRes,
        yesterdaySalesRes,
        newCustomersTodayRes,
        newCustomersYesterdayRes,
        totalCustomersRes,
        productsRes,
        recentRes,
      ]) {
        if (res.error) throw res.error
      }

      const sumTotal = (rows: { total: number }[] | null) =>
        (rows || []).reduce((sum, r) => sum + Number(r.total), 0)

      const lowStockCount = (productsRes.data || []).filter(
        (p) => p.current_stock <= p.minimum_stock
      ).length

      const recentSales: DashboardRecentSale[] = (
        (recentRes.data as unknown as Array<{
          id: string
          total: number
          status: SaleStatus
          created_at: string
          customer: { name: string } | null
        }>) || []
      ).map((s) => ({
        id: s.id,
        customerName: s.customer?.name ?? null,
        total: Number(s.total),
        status: s.status,
        createdAt: s.created_at,
      }))

      return {
        todayTotal: sumTotal(todaySalesRes.data),
        yesterdayTotal: sumTotal(yesterdaySalesRes.data),
        todayOrders: (todaySalesRes.data || []).length,
        yesterdayOrders: (yesterdaySalesRes.data || []).length,
        newCustomersToday: newCustomersTodayRes.count || 0,
        newCustomersYesterday: newCustomersYesterdayRes.count || 0,
        totalCustomers: totalCustomersRes.count || 0,
        lowStockCount,
        recentSales,
      }
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const dashboardService = DashboardService.getInstance()
