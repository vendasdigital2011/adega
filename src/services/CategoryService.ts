import { BaseService } from "./BaseService"
import { Category } from "@/types"
import { sanitizeSearchTerm } from "@/utils/sanitize"

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

      return { data: (data as Category[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
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
      return data as Category
    } catch (error) {
      this.handleDuplicateName(error)
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    try {
      const { data, error } = await this.supabase
        .from("categories")
        .update(input)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "categories", id, null, input)
      return data as Category
    } catch (error) {
      this.handleDuplicateName(error)
      this.handleError(error)
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
