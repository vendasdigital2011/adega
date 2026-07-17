import { BaseService } from "./BaseService"
import { AuditLog } from "@/types"

export interface ListAuditOptions {
  action?: string
  tableName?: string
  userId?: string
  startDate?: string
  endDate?: string
  page: number
  limit: number
}

export interface ListAuditResult {
  data: AuditLog[]
  total: number
}

export interface AuditUserOption {
  id: string
  name: string
}

// Leitura sobre a tabela audit_logs (imutável, escrita por
// BaseService.auditAsCurrentUser e AuthService). RLS restringe à própria
// empresa E exige audit.view (migration 0017).
export class AuditService extends BaseService {
  private static instance: AuditService

  private constructor() {
    super()
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService()
    }
    return AuditService.instance
  }

  public async list(options: ListAuditOptions): Promise<ListAuditResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("audit_logs")
        .select("*, user:users(name, email)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to)

      if (options.action) query = query.eq("action", options.action)
      if (options.tableName) query = query.eq("table_name", options.tableName)
      if (options.userId) query = query.eq("user_id", options.userId)
      if (options.startDate) query = query.gte("created_at", `${options.startDate}T00:00:00`)
      if (options.endDate) query = query.lte("created_at", `${options.endDate}T23:59:59`)

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as unknown as AuditLog[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  // Usuários que aparecem em algum log — alimenta o filtro por usuário.
  public async listUsers(): Promise<AuditUserOption[]> {
    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("id, name")
        .order("name", { ascending: true })
      if (error) throw error
      return (data as AuditUserOption[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const auditService = AuditService.getInstance()
