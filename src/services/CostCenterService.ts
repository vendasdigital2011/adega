import { BaseService } from "./BaseService"
import { CostCenter } from "@/types"

export interface CreateCostCenterInput {
  name: string
}

export interface UpdateCostCenterInput {
  name?: string
  active?: boolean
}

export interface ListCostCentersOptions {
  search?: string
  active?: boolean
  page: number
  limit: number
}

export interface ListCostCentersResult {
  data: CostCenter[]
  total: number
}

export class CostCenterService extends BaseService {
  private static instance: CostCenterService

  private constructor() {
    super()
  }

  public static getInstance(): CostCenterService {
    if (!CostCenterService.instance) {
      CostCenterService.instance = new CostCenterService()
    }
    return CostCenterService.instance
  }

  public async list(options: ListCostCentersOptions): Promise<ListCostCentersResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("cost_centers")
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
      return { data: (data as CostCenter[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async listActive(): Promise<CostCenter[]> {
    try {
      const { data, error } = await this.supabase
        .from("cost_centers")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true })
      if (error) throw error
      return (data as CostCenter[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateCostCenterInput): Promise<CostCenter> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("cost_centers")
        .insert({ company_id: companyId, name: input.name })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "cost_centers", data.id, null, input)
      return data as CostCenter
    } catch (error) {
      this.handleDuplicateName(error)
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateCostCenterInput): Promise<CostCenter> {
    try {
      const { data, error } = await this.supabase
        .from("cost_centers")
        .update(input)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "cost_centers", id, null, input)
      return data as CostCenter
    } catch (error) {
      this.handleDuplicateName(error)
      this.handleError(error)
    }
  }

  private handleDuplicateName(error: unknown): void {
    if ((error as { code?: string })?.code === "23505") {
      this.handleError({ message: "Já existe um centro de custo com esse nome.", code: "DUPLICATE_NAME" })
    }
  }

  public async setActive(id: string, active: boolean): Promise<CostCenter> {
    return this.update(id, { active })
  }
}

export const costCenterService = CostCenterService.getInstance()
