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
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
    }
  }

  public async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.update(id, { status })
  }
}

export const userService = UserService.getInstance()
