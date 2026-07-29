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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Role[] = [
          { id: "r1111111-1111-1111-1111-111111111111", company_id: "c1111111-1111-1111-1111-111111111111", name: "Administrador", description: "Acesso total ao sistema" },
          { id: "r2222222-2222-2222-2222-222222222222", company_id: "c1111111-1111-1111-1111-111111111111", name: "Vendedor", description: "Acesso ao PDV e vendas" },
        ]
        return this.getLocalMockStore("roles", initialMock)
      }
      this.handleError(error, "roles.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Role[] = [
          { id: "r1111111-1111-1111-1111-111111111111", company_id: "c1111111-1111-1111-1111-111111111111", name: "Administrador", description: "Acesso total ao sistema" },
        ]
        const list = this.getLocalMockStore("roles", initialMock)
        const newRole: Role = {
          id: `role-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name,
          description: input.description || null,
        }
        list.push(newRole)
        this.saveLocalMockStore("roles", list)
        return newRole
      }
      this.handleError(error, "roles.create")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Role[] = [
          { id: "r1111111-1111-1111-1111-111111111111", company_id: "c1111111-1111-1111-1111-111111111111", name: "Administrador", description: "Acesso total ao sistema" },
        ]
        const list = this.getLocalMockStore("roles", initialMock)
        const idx = list.findIndex((r) => r.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input }
          this.saveLocalMockStore("roles", list)
          return list[idx]
        }
        const updatedRole: Role = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Perfil Atualizado",
          description: input.description || null,
        }
        list.push(updatedRole)
        this.saveLocalMockStore("roles", list)
        return updatedRole
      }
      this.handleError(error, "roles.update")
    }
  }
}

export const roleService = RoleService.getInstance()
