import { BaseService } from "./BaseService"
import { User, UserStatus } from "@/types"
import { sanitizeSearchTerm } from "@/utils/sanitize"

export interface CreateUserInput {
  email: string
  password: string
  name: string
  phone?: string
  role_id: string
}

export interface UpdateUserInput {
  name?: string
  phone?: string | null
  role_id?: string
  status?: UserStatus
}

export interface ListUsersOptions {
  search?: string
  status?: UserStatus
  roleId?: string
  page: number
  limit: number
}

export interface ListUsersResult {
  data: User[]
  total: number
}

export class UserService extends BaseService {
  private static instance: UserService

  private constructor() {
    super()
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  public async list(options: ListUsersOptions): Promise<ListUsersResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("users")
        .select("*, role:roles(*)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (options.search) {
        const term = sanitizeSearchTerm(options.search)
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      }
      if (options.status) {
        query = query.eq("status", options.status)
      }
      if (options.roleId) {
        query = query.eq("role_id", options.roleId)
      }

      const { data, error, count } = await query
      if (error) throw error

      return { data: (data as User[]) || [], total: count || 0 }
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: User[] = [
          {
            id: "f6928173-b3e0-49ec-bc8f-9d00b46acaa6",
            company_id: "c1111111-1111-1111-1111-111111111111",
            role_id: "r1111111-1111-1111-1111-111111111111",
            email: "teste@teste.com",
            name: "Administrador Teste",
            phone: "(11) 99999-9999",
            status: "active",
            two_fa_enabled: false,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: { id: "r1111111-1111-1111-1111-111111111111", company_id: "c1111111-1111-1111-1111-111111111111", name: "Administrador", description: "Acesso total" },
          },
          {
            id: "f7928173-b3e0-49ec-bc8f-9d00b46acaa7",
            company_id: "c1111111-1111-1111-1111-111111111111",
            role_id: "r2222222-2222-2222-2222-222222222222",
            email: "vendedor@teste.com",
            name: "Vendedor Balcão",
            phone: "(11) 98888-8888",
            status: "active",
            two_fa_enabled: false,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: { id: "r2222222-2222-2222-2222-222222222222", company_id: "c1111111-1111-1111-1111-111111111111", name: "Vendedor", description: "Acesso a vendas" },
          },
        ]
        let items = this.getLocalMockStore("users", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
        }
        if (options.status) {
          items = items.filter((u) => u.status === options.status)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "users.list")
    }
  }

  public async create(input: CreateUserInput): Promise<User> {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw { message: payload?.message || "Não foi possível criar o usuário." }
      }

      return payload.data as User
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: User[] = [
          {
            id: "f6928173-b3e0-49ec-bc8f-9d00b46acaa6",
            company_id: "c1111111-1111-1111-1111-111111111111",
            role_id: "r1111111-1111-1111-1111-111111111111",
            email: "teste@teste.com",
            name: "Administrador Teste",
            phone: "(11) 99999-9999",
            status: "active",
            two_fa_enabled: false,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("users", initialMock)
        const newUser: User = {
          id: `usr-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          role_id: input.role_id,
          email: input.email,
          name: input.name,
          phone: input.phone || null,
          status: "active",
          two_fa_enabled: false,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newUser)
        this.saveLocalMockStore("users", list)
        return newUser
      }
      this.handleError(error, "users.create")
    }
  }

  public async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .update(input)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "users", id, null, input)
      return data as User
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: User[] = [
          {
            id: "f6928173-b3e0-49ec-bc8f-9d00b46acaa6",
            company_id: "c1111111-1111-1111-1111-111111111111",
            role_id: "r1111111-1111-1111-1111-111111111111",
            email: "teste@teste.com",
            name: "Administrador Teste",
            phone: "(11) 99999-9999",
            status: "active",
            two_fa_enabled: false,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("users", initialMock)
        const idx = list.findIndex((u) => u.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("users", list)
          return list[idx]
        }
        const updatedUser: User = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          role_id: input.role_id || "r1111111-1111-1111-1111-111111111111",
          email: "usuario@teste.com",
          name: input.name || "Usuário Atualizado",
          phone: input.phone || null,
          status: input.status || "active",
          two_fa_enabled: false,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedUser)
        this.saveLocalMockStore("users", list)
        return updatedUser
      }
      this.handleError(error, "users.update")
    }
  }

  public async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.update(id, { status })
  }
}

export const userService = UserService.getInstance()
