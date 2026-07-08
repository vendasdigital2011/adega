import { BaseService } from "./BaseService"
import { Role } from "@/types"

export interface CreateRoleInput {
  name: string
  description?: string
}

export class RoleService extends BaseService {
  private static instance: RoleService

  private constructor() {
    super()
  }

  public static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService()
    }
    return RoleService.instance
  }

  public async list(): Promise<Role[]> {
    try {
      const { data, error } = await this.supabase.from("roles").select("*").order("name")
      if (error) throw error
      return (data as Role[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateRoleInput): Promise<Role> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("roles")
        .insert({ ...input, company_id: companyId })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "roles", data.id, null, input)
      return data as Role
    } catch (error) {
      this.handleError(error)
    }
  }

  public async update(id: string, input: Partial<CreateRoleInput>): Promise<Role> {
    try {
      const { data, error } = await this.supabase
        .from("roles")
        .update(input)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "roles", id, null, input)
      return data as Role
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const roleService = RoleService.getInstance()
