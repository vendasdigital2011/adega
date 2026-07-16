import { BaseService } from "./BaseService"
import { Company, Settings, ThemePreference } from "@/types"

export interface UpdateCompanyInput {
  name: string
  document?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
}

export interface UpsertSettingsInput {
  theme: ThemePreference
  currency: string
  timezone: string
  language: string
}

// Tabelas incluídas no backup — tudo que o usuário consegue ler via RLS.
// O conteúdo real de cada uma depende das permissões de quem exporta.
const BACKUP_TABLES = [
  "companies",
  "users",
  "categories",
  "brands",
  "suppliers",
  "customers",
  "products",
  "inventory_movements",
  "purchases",
  "purchase_items",
  "sales",
  "sale_items",
  "cash_registers",
  "cash_movements",
  "cost_centers",
  "accounts_receivable",
  "accounts_payable",
  "receivable_receipts",
  "payable_payments",
  "settings",
] as const

export interface BackupPayload {
  exported_at: string
  tables: Record<string, unknown[]>
}

export class SettingsService extends BaseService {
  private static instance: SettingsService

  private constructor() {
    super()
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  public async getCompany(): Promise<Company> {
    try {
      const { data, error } = await this.supabase.from("companies").select("*").single()
      if (error) throw error
      return data as Company
    } catch (error) {
      this.handleError(error)
    }
  }

  public async updateCompany(input: UpdateCompanyInput): Promise<Company> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const normalized = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])
      )
      const { data, error } = await this.supabase
        .from("companies")
        .update(normalized)
        .eq("id", companyId)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "companies", companyId, null, normalized)
      return data as Company
    } catch (error) {
      this.handleError(error)
    }
  }

  // null quando a empresa ainda não gravou preferências (linha criada no 1º save)
  public async getSettings(): Promise<Settings | null> {
    try {
      const { data, error } = await this.supabase.from("settings").select("*").maybeSingle()
      if (error) throw error
      return (data as Settings) ?? null
    } catch (error) {
      this.handleError(error)
    }
  }

  public async upsertSettings(input: UpsertSettingsInput): Promise<Settings> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("settings")
        .upsert({ company_id: companyId, ...input }, { onConflict: "company_id" })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "settings", (data as Settings).id, null, input)
      return data as Settings
    } catch (error) {
      this.handleError(error)
    }
  }

  public async exportBackup(): Promise<BackupPayload> {
    try {
      const results = await Promise.all(
        BACKUP_TABLES.map((table) => this.supabase.from(table).select("*"))
      )

      const tables: Record<string, unknown[]> = {}
      results.forEach((res, i) => {
        if (res.error) throw res.error
        tables[BACKUP_TABLES[i]] = res.data || []
      })

      return { exported_at: new Date().toISOString(), tables }
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const settingsService = SettingsService.getInstance()
