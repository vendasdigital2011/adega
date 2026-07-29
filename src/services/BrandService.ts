import { BaseService } from "./BaseService"
import { Brand } from "@/types"
import { cacheService } from "./cache/CacheService"
import { CacheKeys } from "./cache/CacheKeys"
import { CACHE_TTL } from "./cache/CacheTTL"

export interface CreateBrandInput {
  name: string
}

export interface UpdateBrandInput {
  name?: string
  active?: boolean
}

export interface ListBrandsOptions {
  search?: string
  active?: boolean
  page: number
  limit: number
}

export interface ListBrandsResult {
  data: Brand[]
  total: number
}

export class BrandService extends BaseService {
  private static instance: BrandService

  private constructor() {
    super()
  }

  public static getInstance(): BrandService {
    if (!BrandService.instance) {
      BrandService.instance = new BrandService()
    }
    return BrandService.instance
  }

  public async list(options: ListBrandsOptions): Promise<ListBrandsResult> {
    try {
      const companyId = (await this.getCurrentUserCompanyId()) || "default"
      const cacheKey = `${CacheKeys.brands(companyId)}:${options.page}:${options.limit}:${options.search || ""}:${options.active ?? "all"}`
      const cached = await cacheService.get<ListBrandsResult>(cacheKey)
      if (cached) return cached
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("brands")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to)

      if (options.search) {
        query = query.ilike("name", `%${options.search}%`)
      }
      if (typeof options.active === "boolean") {
        query = query.eq("active", options.active)
      }

      const { data, error, count } = await query
      if (error) throw error

      const result: ListBrandsResult = { data: (data as Brand[]) || [], total: count || 0 }
      await cacheService.set(cacheKey, result, CACHE_TTL.BRANDS)
      return result
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Brand[] = [
          { id: "brand-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Adega Premium", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "brand-2", company_id: "c1111111-1111-1111-1111-111111111111", name: "Cervejaria Artesanal", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "brand-3", company_id: "c1111111-1111-1111-1111-111111111111", name: "Vinícola Aurora", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        let items = this.getLocalMockStore("brands", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter((b) => b.name.toLowerCase().includes(term))
        }
        if (typeof options.active === "boolean") {
          items = items.filter((b) => b.active === options.active)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "brands.list")
    }
  }

  public async create(input: CreateBrandInput): Promise<Brand> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("brands")
        .insert({ company_id: companyId, name: input.name })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "brands", data.id, null, input)
      await cacheService.invalidatePattern(CacheKeys.brands(companyId) + "*")
      return data as Brand
    } catch (error) {
      this.handleDuplicateName(error)
      if (this.isOfflineOrDemoMode(error)) {
        const companyId = "c1111111-1111-1111-1111-111111111111"
        const initialMock: Brand[] = [
          { id: "brand-1", company_id: companyId, name: "Adega Premium", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        const list = this.getLocalMockStore("brands", initialMock)
        const newBrand: Brand = {
          id: `brand-${Date.now()}`,
          company_id: companyId,
          name: input.name,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newBrand)
        this.saveLocalMockStore("brands", list)
        await cacheService.invalidatePattern(CacheKeys.brands(companyId) + "*")
        return newBrand
      }
      this.handleError(error, "brands.create")
    }
  }

  public async update(id: string, input: UpdateBrandInput): Promise<Brand> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("brands")
        .update(input)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "brands", id, null, input)
      await cacheService.invalidatePattern(CacheKeys.brands(companyId) + "*")
      return data as Brand
    } catch (error) {
      this.handleDuplicateName(error)
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Brand[] = [
          { id: "brand-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Adega Premium", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        const list = this.getLocalMockStore("brands", initialMock)
        const idx = list.findIndex((b) => b.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("brands", list)
          return list[idx]
        }
        const updatedMock: Brand = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Marca Atualizada",
          active: typeof input.active === "boolean" ? input.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedMock)
        this.saveLocalMockStore("brands", list)
        return updatedMock
      }
      this.handleError(error, "brands.update")
    }
  }

  private handleDuplicateName(error: unknown): void {
    if ((error as { code?: string })?.code === "23505") {
      this.handleError({ message: "Já existe uma marca com esse nome.", code: "DUPLICATE_NAME" })
    }
  }

  public async setActive(id: string, active: boolean): Promise<Brand> {
    return this.update(id, { active })
  }
}

export const brandService = BrandService.getInstance()
