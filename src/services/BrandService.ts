import { BaseService } from "./BaseService"
import { Brand } from "@/types"

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

      return { data: (data as Brand[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
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
      return data as Brand
    } catch (error) {
      this.handleDuplicateName(error)
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateBrandInput): Promise<Brand> {
    try {
      const { data, error } = await this.supabase
        .from("brands")
        .update(input)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "brands", id, null, input)
      return data as Brand
    } catch (error) {
      this.handleDuplicateName(error)
      this.handleError(error)
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
