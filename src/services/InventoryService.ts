import { BaseService } from "./BaseService"
import { InventoryMovement, MovementType, Product } from "@/types"
import { sanitizeSearchTerm } from "@/utils/sanitize"

export interface RegisterMovementInput {
  product_id: string
  movement_type: MovementType
  quantity: number
  reference?: string | null
  observation?: string | null
}

export interface ListMovementsOptions {
  search?: string
  movementType?: MovementType
  page: number
  limit: number
}

export interface ListMovementsResult {
  data: InventoryMovement[]
  total: number
}

// !inner garante paginação/contagem corretas ao filtrar pelo produto; como
// product_id é on delete restrict, todo movimento sempre tem produto.
const SELECT_WITH_PRODUCT = "*, product:products!inner(name, sku)"

export class InventoryService extends BaseService {
  private static instance: InventoryService

  private constructor() {
    super()
  }

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
  }

  public async listMovements(options: ListMovementsOptions): Promise<ListMovementsResult> {
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
        observation: "Entrada de compra de estoque",
        user_id: "u1",
        created_at: new Date().toISOString(),
        product: { name: "Vinho Tinto Cabernet Sauvignon 750ml", sku: "VIN-CAB-001" },
      },
      {
        id: "mov-2",
        company_id: "c1111111-1111-1111-1111-111111111111",
        product_id: "prod-2",
        movement_type: "Saída",
        quantity: 2,
        previous_quantity: 122,
        current_quantity: 120,
        reference: "VEN-001",
        observation: "Venda PDV #1001",
        user_id: "u1",
        created_at: new Date().toISOString(),
        product: { name: "Cerveja IPA Artesanal 500ml", sku: "CER-IPA-002" },
      },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      let list = this.getLocalMockStore("inventory_movements", mockMovements)
      if (options.movementType) {
        list = list.filter((m) => m.movement_type === options.movementType)
      }
      if (options.search) {
        const s = options.search.toLowerCase()
        list = list.filter((m) => (m.product?.name || "").toLowerCase().includes(s) || (m.product?.sku || "").toLowerCase().includes(s))
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
        .from("inventory_movements")
        .select(SELECT_WITH_PRODUCT, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (options.movementType) {
        query = query.eq("movement_type", options.movementType)
      }
      if (options.search) {
        // Filtra pelo produto relacionado (nome ou SKU).
        const term = sanitizeSearchTerm(options.search)
        query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`, {
          referencedTable: "products",
        })
      }

      const { data, error, count } = await query
      if (error) throw error

      return { data: (data as unknown as InventoryMovement[]) || [], total: count || 0 }
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        let list = this.getLocalMockStore("inventory_movements", mockMovements)
        if (options.movementType) {
          list = list.filter((m) => m.movement_type === options.movementType)
        }
        if (options.search) {
          const s = options.search.toLowerCase()
          list = list.filter((m) => (m.product?.name || "").toLowerCase().includes(s) || (m.product?.sku || "").toLowerCase().includes(s))
        }
        const total = list.length
        const from = (options.page - 1) * options.limit
        const pagedData = list.slice(from, from + options.limit)
        return { data: pagedData, total }
      }
      this.handleError(error, "inventory.list_movements")
    }
  }

  public async registerMovement(input: RegisterMovementInput): Promise<InventoryMovement> {
    try {
      const { data, error } = await this.supabase.rpc("register_inventory_movement", {
        p_product_id: input.product_id,
        p_movement_type: input.movement_type,
        p_quantity: input.quantity,
        p_reference: input.reference || null,
        p_observation: input.observation || null,
      })
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "inventory_movements", (data as InventoryMovement).id, null, input)
      return data as InventoryMovement
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const isEntrada = input.movement_type === "Entrada"
        const mockMov: InventoryMovement = {
          id: `mov-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          product_id: input.product_id,
          movement_type: input.movement_type,
          quantity: input.quantity,
          previous_quantity: 10,
          current_quantity: isEntrada ? 10 + input.quantity : 10 - input.quantity,
          reference: input.reference || null,
          observation: input.observation || null,
          user_id: "u1",
          created_at: new Date().toISOString(),
        }
        return mockMov
      }
      this.handleError(error, "inventory.register_movement")
    }
  }

  // Produtos ativos com saldo no mínimo ou abaixo. PostgREST não compara duas
  // colunas entre si, então buscamos os ativos e filtramos no cliente.
  public async listLowStock(): Promise<Product[]> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("current_stock", { ascending: true })
      if (error) throw error
      return ((data as unknown as Product[]) || []).filter(
        (p) => p.current_stock <= p.minimum_stock
      )
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return [
          {
            id: "prod-2",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Cerveja Artesanal IPA 500ml",
            sku: "CER-IPA-002",
            category_id: "cat-2",
            brand_id: null,
            supplier_id: null,
            barcode: null,
            description: null,
            unit: "UN",
            purchase_price: 9.00,
            sale_price: 18.50,
            wholesale_price: null,
            promotion_price: null,
            current_stock: 8,
            minimum_stock: 15,
            image_url: null,
            batch_number: null,
            expiry_date: null,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
      }
      this.handleError(error, "inventory.list_low_stock")
    }
  }
}

export const inventoryService = InventoryService.getInstance()
