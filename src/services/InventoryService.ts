import { BaseService } from "./BaseService"
import { InventoryMovement, MovementType, Product } from "@/types"

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
        query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`, {
          referencedTable: "products",
        })
      }

      const { data, error, count } = await query
      if (error) throw error

      return { data: (data as unknown as InventoryMovement[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
    }
  }
}

export const inventoryService = InventoryService.getInstance()
