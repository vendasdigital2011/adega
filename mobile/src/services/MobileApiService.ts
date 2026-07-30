import { Product, DashboardSummary, FinancialSummary, StockAlert, AuditLog, CashRegisterSession } from "../types"

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Vinho Tinto Cabernet Sauvignon 750ml",
    sku: "VIN-CAB-001",
    barcode: "7891234567890",
    category: "Vinhos Tintos",
    price: 49.90,
    costPrice: 25.00,
    stock: 45,
    minStock: 10,
    unit: "UN",
  },
  {
    id: "p2",
    name: "Cerveja IPA Artesanal 500ml",
    sku: "CER-IPA-002",
    barcode: "7891234567891",
    category: "Cervejas Especiais",
    price: 18.90,
    costPrice: 8.50,
    stock: 120,
    minStock: 20,
    unit: "UN",
  },
  {
    id: "p3",
    name: "Whisky 12 Anos Reserve 1L",
    sku: "WHI-RES-003",
    barcode: "7891234567892",
    category: "Destilados",
    price: 189.00,
    costPrice: 110.00,
    stock: 4,
    minStock: 5,
    unit: "UN",
  },
  {
    id: "p4",
    name: "Vodka Premium Importada 750ml",
    sku: "VOD-PRE-004",
    barcode: "7891234567893",
    category: "Destilados",
    price: 99.90,
    costPrice: 55.00,
    stock: 3,
    minStock: 8,
    unit: "UN",
  },
  {
    id: "p5",
    name: "Espumante Brut Rosé 750ml",
    sku: "ESP-ROS-005",
    barcode: "7891234567894",
    category: "Espumantes",
    price: 64.90,
    costPrice: 32.00,
    stock: 18,
    minStock: 10,
    unit: "UN",
  },
]

export class MobileApiService {
  public static async getDashboard(): Promise<DashboardSummary> {
    return {
      todayTotal: 1450.50,
      todayOrders: 14,
      yesterdayTotal: 980.00,
      ticketMedio: 103.60,
      lowStockCount: 2,
      recentSales: [
        { id: "s101", customerName: "Cliente Balcão", total: 159.90, paymentMethod: "Cartão de Crédito", createdAt: "13:45" },
        { id: "s102", customerName: "Maria Oliveira", total: 89.90, paymentMethod: "PIX", createdAt: "12:30" },
        { id: "s103", customerName: "Carlos Pereira", total: 320.00, paymentMethod: "PIX", createdAt: "11:15" },
        { id: "s104", customerName: "Ana Costa", total: 45.00, paymentMethod: "Dinheiro", createdAt: "10:05" },
      ],
    }
  }

  public static async getFinancial(): Promise<FinancialSummary> {
    return {
      cashBalance: 2450.00,
      payablesToday: 450.00,
      receivablesToday: 890.00,
      monthRevenue: 34500.00,
      monthProfit: 12800.00,
    }
  }

  public static async getStockAlerts(): Promise<StockAlert[]> {
    return [
      { id: "p3", name: "Whisky 12 Anos Reserve 1L", sku: "WHI-RES-003", currentStock: 4, minStock: 5, status: "WARNING" },
      { id: "p4", name: "Vodka Premium Importada 750ml", sku: "VOD-PRE-004", currentStock: 3, minStock: 8, status: "CRITICAL" },
    ]
  }

  public static async getAuditLogs(): Promise<AuditLog[]> {
    return [
      { id: "a1", user: "Vendedor Balcão", action: "Sangria de Caixa", details: "Retirada de R$ 300,00 para depósito", timestamp: "14:10" },
      { id: "a2", user: "Vendedor Balcão", action: "Abertura de Caixa", details: "Fundo inicial R$ 200,00", timestamp: "08:00" },
      { id: "a3", user: "Administrador", action: "Ajuste de Estoque", details: "Entrada +12 Whisky 12 Anos", timestamp: "Ontem, 17:30" },
    ]
  }

  public static async searchProducts(query: string): Promise<Product[]> {
    const q = query.trim().toLowerCase()
    if (!q) return MOCK_PRODUCTS
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
    )
  }

  public static async findByBarcode(barcode: string): Promise<Product | null> {
    const clean = barcode.trim()
    return MOCK_PRODUCTS.find((p) => p.barcode === clean) || null
  }

  public static async getCashSession(): Promise<CashRegisterSession> {
    return {
      isOpen: true,
      openedAt: "08:00",
      initialBalance: 200.00,
      currentBalance: 1650.50,
      salesTotal: 1750.50,
      sangriaTotal: 300.00,
    }
  }

  public static async registerSale(items: { productId: string; qty: number }[], paymentMethod: string): Promise<{ success: boolean; saleId: string }> {
    return {
      success: true,
      saleId: `sale-${Math.floor(Math.random() * 10000)}`,
    }
  }
}
