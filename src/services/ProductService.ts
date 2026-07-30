import { BaseService } from "./BaseService"
import { Product } from "@/types"
import { cacheService } from "./cache/CacheService"
import { CacheKeys } from "./cache/CacheKeys"
import { CACHE_TTL } from "./cache/CacheTTL"

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
    const initialMock: Product[] = [
      {
        id: "prod-1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        name: "Vinho Tinto Cabernet Sauvignon 750ml",
        sku: "VIN-CAB-001",
        category_id: "cat-1",
        brand_id: "brand-1",
        supplier_id: "sup-1",
        barcode: "7891234567890",
        description: "Vinho tinto seco de mesa",
        unit: "UN",
        purchase_price: 25.0,
        sale_price: 49.9,
        wholesale_price: null,
        promotion_price: null,
        minimum_stock: 10,
        current_stock: 45,
        image_url: null,
        batch_number: "L-2026-A",
        expiry_date: "2027-12-31",
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
        brand_id: "brand-2",
        supplier_id: "sup-1",
        barcode: "7891234567891",
        description: "Cerveja IPA com amargor pronunciado",
        unit: "UN",
        purchase_price: 8.5,
        sale_price: 18.9,
        wholesale_price: null,
        promotion_price: null,
        minimum_stock: 20,
        current_stock: 120,
        image_url: null,
        batch_number: "L-2026-B",
        expiry_date: "2026-10-15",
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: { name: "Cervejas Especiais" },
        brand: { name: "Colorado" },
      },
    ]

    if (this.isOfflineOrDemoMode()) {
      let list = this.getLocalMockStore("products", initialMock)
      if (options.search) {
        const s = options.search.toLowerCase()
        list = list.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.barcode || "").includes(s))
      }
      if (typeof options.active === "boolean") {
        list = list.filter((p) => p.active === options.active)
      }
      if (options.categoryId) {
        list = list.filter((p) => p.category_id === options.categoryId)
      }
      const total = list.length
      const from = (options.page - 1) * options.limit
      const pagedData = list.slice(from, from + options.limit)
      return { data: pagedData, total }
    }

    try {
      const companyId = (await this.getCurrentUserCompanyId()) || "default"
      const cacheKey = `${CacheKeys.productsList(companyId)}:${options.page}:${options.limit}:${options.search || ""}:${options.active ?? "all"}:${options.categoryId || ""}`
      const cached = await cacheService.get<ListProductsResult>(cacheKey)
      if (cached) return cached
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

      const result: ListProductsResult = { data: (data as unknown as Product[]) || [], total: count || 0 }
      await cacheService.set(cacheKey, result, CACHE_TTL.PRODUCTS)
      return result
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Product[] = [
          {
            id: "prod-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Vinho Tinto Cabernet Sauvignon 750ml",
            sku: "VIN-CAB-001",
            category_id: "cat-1",
            brand_id: "brand-1",
            supplier_id: "sup-1",
            barcode: "7891234567890",
            description: "Vinho tinto seco de mesa",
            unit: "UN",
            purchase_price: 25.00,
            sale_price: 49.90,
            wholesale_price: null,
            promotion_price: null,
            minimum_stock: 10,
            current_stock: 45,
            image_url: null,
            batch_number: "L-2026-A",
            expiry_date: "2028-12-31",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { name: "Vinhos Tintos" },
            brand: { name: "Adega Premium" },
          },
          {
            id: "prod-2",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Cerveja Artesanal IPA 500ml",
            sku: "CER-IPA-002",
            category_id: "cat-2",
            brand_id: "brand-2",
            supplier_id: "sup-2",
            barcode: "7899876543210",
            description: "Cerveja artesanal estilo IPA",
            unit: "UN",
            purchase_price: 9.00,
            sale_price: 18.50,
            wholesale_price: null,
            promotion_price: null,
            minimum_stock: 15,
            current_stock: 8,
            image_url: null,
            batch_number: "L-2026-B",
            expiry_date: "2027-06-30",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: { name: "Cervejas Especiais" },
            brand: { name: "Cervejaria Artesanal" },
          },
        ]
        let items = this.getLocalMockStore("products", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter(
            (p) =>
              p.name.toLowerCase().includes(term) ||
              p.sku.toLowerCase().includes(term) ||
              (p.barcode && p.barcode.includes(term))
          )
        }
        if (typeof options.active === "boolean") {
          items = items.filter((p) => p.active === options.active)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "products.list")
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
      await cacheService.invalidatePattern(CacheKeys.patterns.products(companyId))
      return data as unknown as Product
    } catch (error) {
      this.handleDuplicateSku(error)
      if (this.isOfflineOrDemoMode(error)) {
        const companyId = "c1111111-1111-1111-1111-111111111111"
        const initialMock: Product[] = [
          {
            id: "prod-1",
            company_id: companyId,
            name: "Vinho Tinto Cabernet Sauvignon 750ml",
            sku: "VIN-CAB-001",
            category_id: "cat-1",
            brand_id: "brand-1",
            supplier_id: "sup-1",
            barcode: "7891234567890",
            description: "Vinho tinto seco de mesa",
            unit: "UN",
            purchase_price: 25.00,
            sale_price: 49.90,
            wholesale_price: null,
            promotion_price: null,
            minimum_stock: 10,
            current_stock: 45,
            image_url: null,
            batch_number: "L-2026-A",
            expiry_date: "2028-12-31",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("products", initialMock)
        const newMockProduct: Product = {
          id: `prod-${Date.now()}`,
          company_id: companyId,
          name: input.name,
          sku: input.sku,
          category_id: input.category_id,
          brand_id: input.brand_id || null,
          supplier_id: input.supplier_id || null,
          barcode: input.barcode || null,
          description: input.description || null,
          unit: input.unit || "UN",
          purchase_price: input.purchase_price || null,
          sale_price: input.sale_price,
          wholesale_price: input.wholesale_price || null,
          promotion_price: input.promotion_price || null,
          minimum_stock: input.minimum_stock,
          current_stock: 0,
          image_url: null,
          batch_number: input.batch_number || null,
          expiry_date: input.expiry_date || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newMockProduct)
        this.saveLocalMockStore("products", list)
        await cacheService.invalidatePattern(CacheKeys.patterns.products(companyId))
        return newMockProduct
      }
      this.handleError(error, "products.create")
    }
  }

  public async update(id: string, input: UpdateProductInput): Promise<Product> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("products")
        .update(this.normalize(input))
        .eq("id", id)
        .select(SELECT_WITH_RELATIONS)
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "products", id, null, input)
      await cacheService.invalidatePattern(CacheKeys.patterns.products(companyId))
      return data as unknown as Product
    } catch (error) {
      this.handleDuplicateSku(error)
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Product[] = [
          {
            id: "prod-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Vinho Tinto Cabernet Sauvignon 750ml",
            sku: "VIN-CAB-001",
            category_id: "cat-1",
            brand_id: "brand-1",
            supplier_id: "sup-1",
            barcode: "7891234567890",
            description: "Vinho tinto seco de mesa",
            unit: "UN",
            purchase_price: 25.00,
            sale_price: 49.90,
            wholesale_price: null,
            promotion_price: null,
            minimum_stock: 10,
            current_stock: 45,
            image_url: null,
            batch_number: "L-2026-A",
            expiry_date: "2028-12-31",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("products", initialMock)
        const idx = list.findIndex((p) => p.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("products", list)
          return list[idx]
        }
        const updatedProd: Product = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Produto Atualizado",
          sku: input.sku || "SKU-UPDATE",
          category_id: input.category_id || "cat-1",
          brand_id: input.brand_id || null,
          supplier_id: input.supplier_id || null,
          barcode: input.barcode || null,
          description: input.description || null,
          unit: input.unit || "UN",
          purchase_price: input.purchase_price || null,
          sale_price: input.sale_price || 10.0,
          wholesale_price: input.wholesale_price || null,
          promotion_price: input.promotion_price || null,
          minimum_stock: input.minimum_stock || 5,
          current_stock: 10,
          image_url: null,
          batch_number: input.batch_number || null,
          expiry_date: input.expiry_date || null,
          active: typeof input.active === "boolean" ? input.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedProd)
        this.saveLocalMockStore("products", list)
        return updatedProd
      }
      this.handleError(error, "products.update")
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
