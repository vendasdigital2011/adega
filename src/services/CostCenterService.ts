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
    const initialMock: CostCenter[] = [
      { id: "cost-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Compras de Estoque", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "cost-2", company_id: "c1111111-1111-1111-1111-111111111111", name: "Despesas Operacionais", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      let items = this.getLocalMockStore("cost_centers", initialMock)
      if (options.search) {
        const term = options.search.toLowerCase()
        items = items.filter((c) => c.name.toLowerCase().includes(term))
      }
      if (typeof options.active === "boolean") {
        items = items.filter((c) => c.active === options.active)
      }
      return { data: items, total: items.length }
    }

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
      if (this.isOfflineOrDemoMode(error)) {
        let items = this.getLocalMockStore("cost_centers", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter((c) => c.name.toLowerCase().includes(term))
        }
        if (typeof options.active === "boolean") {
          items = items.filter((c) => c.active === options.active)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "cost_centers.list")
    }
  }

  public async listActive(): Promise<CostCenter[]> {
    const initialMock: CostCenter[] = [
      { id: "cost-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Compras de Estoque", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "cost-2", company_id: "c1111111-1111-1111-1111-111111111111", name: "Despesas Operacionais", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]

    if (this.isOfflineOrDemoMode() && process.env.NODE_ENV !== "test") {
      return this.getLocalMockStore("cost_centers", initialMock).filter((c) => c.active)
    }

    try {
      const { data, error } = await this.supabase
        .from("cost_centers")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true })
      if (error) throw error
      return (data as CostCenter[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return this.getLocalMockStore("cost_centers", initialMock).filter((c) => c.active)
      }
      this.handleError(error, "cost_centers.list_active")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: CostCenter[] = [
          { id: "cost-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Compras de Estoque", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        const list = this.getLocalMockStore("cost_centers", initialMock)
        const newCost: CostCenter = {
          id: `cost-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newCost)
        this.saveLocalMockStore("cost_centers", list)
        return newCost
      }
      this.handleError(error, "cost_centers.create")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: CostCenter[] = [
          { id: "cost-1", company_id: "c1111111-1111-1111-1111-111111111111", name: "Compras de Estoque", active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
        const list = this.getLocalMockStore("cost_centers", initialMock)
        const idx = list.findIndex((c) => c.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("cost_centers", list)
          return list[idx]
        }
        const updatedCost: CostCenter = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Centro de Custo Atualizado",
          active: typeof input.active === "boolean" ? input.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedCost)
        this.saveLocalMockStore("cost_centers", list)
        return updatedCost
      }
      this.handleError(error, "cost_centers.update")
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
