export type UserRole = "ADMIN" | "VENDEDOR"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  roleName: string
  companyName: string
}

export interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  price: number
  costPrice: number
  stock: number
  minStock: number
  unit: string
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}

export interface DashboardSummary {
  todayTotal: number
  todayOrders: number
  yesterdayTotal: number
  ticketMedio: number
  lowStockCount: number
  recentSales: {
    id: string
    customerName: string
    total: number
    paymentMethod: string
    createdAt: string
  }[]
}

export interface FinancialSummary {
  cashBalance: number
  payablesToday: number
  receivablesToday: number
  monthRevenue: number
  monthProfit: number
}

export interface StockAlert {
  id: string
  name: string
  sku: string
  currentStock: number
  minStock: number
  status: "CRITICAL" | "WARNING"
}

export interface AuditLog {
  id: string
  user: string
  action: string
  details: string
  timestamp: string
}

export interface CashRegisterSession {
  isOpen: boolean
  openedAt?: string
  initialBalance: number
  currentBalance: number
  salesTotal: number
  sangriaTotal: number
}
