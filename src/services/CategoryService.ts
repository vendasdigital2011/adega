import { BaseService } from "./BaseService"
import { Category } from "@/types"
import { sanitizeSearchTerm } from "@/utils/sanitize"
import { cacheService } from "./cache/CacheService"
import { CacheKeys } from "./cache/CacheKeys"
import { CACHE_TTL } from "./cache/CacheTTL"

export interface CreateCategoryInput {
  name: string
  description?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  description?: string | null
  active?: boolean
}

export interface ListCategoriesOptions {
  search?: string
  active?: boolean
  page: number
  limit: number
}

export interface ListCategoriesResult {
  data: Category[]
  total: number
}

export class CategoryService extends BaseService {
  private static instance: CategoryService

  private constructor() {
    super()
  }

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService()
    }
    return CategoryService.instance
  }

  public async list(options: ListCategoriesOptions): Promise<ListCategoriesResult> {
    try {
      const companyId = (await this.getCurrentUserCompanyId()) || "default"
      const cacheKey = `${CacheKeys.categories(companyId)}:${options.page}:${options.limit}:${options.search || ""}:${options.active ?? "all"}`
      const cached = await cacheService.get<ListCategoriesResult>(cacheKey)
      if (cached) return cached
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("categories")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to)

      if (options.search) {
        const term = sanitizeSearchTerm(options.search)
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
      }
      if (typeof options.active === "boolean") {
        query = query.eq("active", options.active)
      }

      const { data, error, count } = await query
      if (error) throw error

      const result: ListCategoriesResult = { data: (data as Category[]) || [], total: count || 0 }
      await cacheService.set(cacheKey, result, CACHE_TTL.CATEGORIES)
      return result
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Category[] = [
          { id: "cat-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Vinhos Tintos", description: "Vinhos tintos nacionais e importados", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "cat-2", company_id: "c1111111-1111-1111-1111-111111111111", name: "Cervejas Especiais", description: "Cervejas artesanais e especiais", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "cat-3", company_id: "c1111111-1111-1111-1111-111111111111", name: "Destilados", description: "Whisky, Vodka, Gin e Cachaça", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        let items = this.getLocalMockStore("categories", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter((c) => c.name.toLowerCase().includes(term) || (c.description && c.description.toLowerCase().includes(term)))
        }
        if (typeof options.active === "boolean") {
          items = items.filter((c) => c.active === options.active)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "categories.list")
    }
  }

  public async create(input: CreateCategoryInput): Promise<Category> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("categories")
        .insert({
          company_id: companyId,
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "categories", data.id, null, input)
      await cacheService.invalidatePattern(CacheKeys.categories(companyId) + "*")
      return data as Category
    } catch (error) {
      this.handleDuplicateName(error)
      if (this.isOfflineOrDemoMode(error)) {
        const companyId = "c1111111-1111-1111-1111-111111111111"
        const initialMock: Category[] = [
          { id: "cat-1", company_id: companyId, name: "Vinhos Tintos", description: "Vinhos tintos nacionais e importados", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "cat-2", company_id: companyId, name: "Cervejas Especiais", description: "Cervejas artesanais e especiais", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        const list = this.getLocalMockStore("categories", initialMock)
        const newCat: Category = {
          id: `cat-${Date.now()}`,
          company_id: companyId,
          name: input.name,
          description: input.description || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newCat)
        this.saveLocalMockStore("categories", list)
        await cacheService.invalidatePattern(CacheKeys.categories(companyId) + "*")
        return newCat
      }
      this.handleError(error, "categories.create")
    }
  }

  public async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("categories")
        .update(input)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "categories", id, null, input)
      await cacheService.invalidatePattern(CacheKeys.categories(companyId) + "*")
      return data as Category
    } catch (error) {
      this.handleDuplicateName(error)
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Category[] = [
          { id: "cat-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Vinhos Tintos", description: "Vinhos tintos nacionais e importados", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        const list = this.getLocalMockStore("categories", initialMock)
        const idx = list.findIndex((c) => c.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("categories", list)
          await cacheService.invalidatePattern(CacheKeys.categories("c1111111-1111-1111-1111-111111111111") + "*")
          return list[idx]
        }
        const updatedMock: Category = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Categoria Atualizada",
          description: input.description || null,
          active: typeof input.active === "boolean" ? input.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedMock)
        this.saveLocalMockStore("categories", list)
        await cacheService.invalidatePattern(CacheKeys.categories("c1111111-1111-1111-1111-111111111111") + "*")
        return updatedMock
      }
      this.handleError(error, "categories.update")
    }
  }

  private handleDuplicateName(error: unknown): void {
    if ((error as { code?: string })?.code === "23505") {
      this.handleError({ message: "Já existe uma categoria com esse nome.", code: "DUPLICATE_NAME" })
    }
  }

  public async setActive(id: string, active: boolean): Promise<Category> {
    return this.update(id, { active })
  }
}

export const categoryService = CategoryService.getInstance()
