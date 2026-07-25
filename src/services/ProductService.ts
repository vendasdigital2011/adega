import { BaseService } from "./BaseService"
import { Product } from "@/types"

export interface CreateProductInput {
  name: string
  sku: string
  category_id: string
  brand_id?: string | null
  supplier_id?: string | null
  barcode?: string | null
  description?: string | null
  unit?: string | null
  purchase_price?: number | null
  sale_price: number
  wholesale_price?: number | null
  promotion_price?: number | null
  minimum_stock: number
  batch_number?: string | null
  expiry_date?: string | null
}

export type UpdateProductInput = Partial<CreateProductInput> & { active?: boolean }

export interface ListProductsOptions {
  search?: string
  active?: boolean
  categoryId?: string
  page: number
  limit: number
}

export interface ListProductsResult {
  data: Product[]
  total: number
}

const SELECT_WITH_RELATIONS = "*, category:categories(name), brand:brands(name)"

export class ProductService extends BaseService {
  private static instance: ProductService

  private constructor() {
    super()
  }

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService()
    }
    return ProductService.instance
  }

  public async list(options: ListProductsOptions): Promise<ListProductsResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("products")
        .select(SELECT_WITH_RELATIONS, { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to)

      if (options.search) {
        query = query.or(
          `name.ilike.%${options.search}%,sku.ilike.%${options.search}%,barcode.ilike.%${options.search}%`
        )
      }
      if (typeof options.active === "boolean") {
        query = query.eq("active", options.active)
      }
      if (options.categoryId) {
        query = query.eq("category_id", options.categoryId)
      }

      const { data, error, count } = await query
      if (error) throw error

      return { data: (data as unknown as Product[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateProductInput): Promise<Product> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("products")
        .insert({ company_id: companyId, ...this.normalize(input) })
        .select(SELECT_WITH_RELATIONS)
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "products", data.id, null, input)
      return data as unknown as Product
    } catch (error) {
      this.handleDuplicateSku(error)
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateProductInput): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from("products")
        .update(this.normalize(input))
        .eq("id", id)
        .select(SELECT_WITH_RELATIONS)
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "products", id, null, input)
      return data as unknown as Product
    } catch (error) {
      this.handleDuplicateSku(error)
      this.handleError(error)
    }
  }

  public async setActive(id: string, active: boolean): Promise<Product> {
    return this.update(id, { active })
  }

  // Campos opcionais vazios viram null (FKs de marca/fornecedor, preços, etc.).
  private normalize<T extends object>(input: T): T {
    const out = { ...(input as Record<string, unknown>) }
    const nullableKeys = [
      "brand_id",
      "supplier_id",
      "barcode",
      "description",
      "unit",
      "purchase_price",
      "wholesale_price",
      "promotion_price",
      "image_url",
      "batch_number",
      "expiry_date",
    ]
    for (const key of nullableKeys) {
      if (key in out && (out[key] === "" || out[key] === undefined)) {
        out[key] = null
      }
    }
    return out as T
  }

  private handleDuplicateSku(error: unknown): void {
    if ((error as { code?: string })?.code === "23505") {
      this.handleError({ message: "Já existe um produto com esse SKU.", code: "DUPLICATE_SKU" })
    }
  }
}

export const productService = ProductService.getInstance()
