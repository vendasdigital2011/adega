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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Company[] = [
          {
            id: "c1111111-1111-1111-1111-111111111111",
            name: "Adega Cloud Demo",
            document: "12.345.678/0001-99",
            email: "contato@adegacloud.com.br",
            phone: "(11) 99999-8888",
            address: "Rua do Comércio, 100",
            city: "São Paulo",
            state: "SP",
            zip_code: "01000-000",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("companies", initialMock)
        return list[0]
      }
      this.handleError(error, "settings.get_company")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Company[] = [
          {
            id: "c1111111-1111-1111-1111-111111111111",
            name: "Adega Cloud Demo",
            document: "12.345.678/0001-99",
            email: "contato@adegacloud.com.br",
            phone: "(11) 99999-8888",
            address: "Rua do Comércio, 100",
            city: "São Paulo",
            state: "SP",
            zip_code: "01000-000",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("companies", initialMock)
        list[0] = { ...list[0], ...input, updated_at: new Date().toISOString() }
        this.saveLocalMockStore("companies", list)
        return list[0]
      }
      this.handleError(error, "settings.update_company")
    }
  }

  // null quando a empresa ainda não gravou preferências (linha criada no 1º save)
  public async getSettings(): Promise<Settings | null> {
    try {
      const { data, error } = await this.supabase.from("settings").select("*").maybeSingle()
      if (error) throw error
      return (data as Settings) ?? null
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Settings[] = [
          {
            id: "set-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            logo_url: null,
            theme: "system",
            currency: "BRL",
            timezone: "America/Sao_Paulo",
            language: "pt-BR",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("settings", initialMock)
        return list[0] || null
      }
      this.handleError(error, "settings.get_settings")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Settings[] = [
          {
            id: "set-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            logo_url: null,
            theme: "system",
            currency: "BRL",
            timezone: "America/Sao_Paulo",
            language: "pt-BR",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("settings", initialMock)
        const updated: Settings = {
          id: list[0]?.id || "set-1",
          company_id: "c1111111-1111-1111-1111-111111111111",
          logo_url: list[0]?.logo_url || null,
          ...input,
          created_at: list[0]?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        this.saveLocalMockStore("settings", [updated])
        return updated
      }
      this.handleError(error, "settings.upsert_settings")
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
      if (this.isOfflineOrDemoMode(error)) {
        return {
          exported_at: new Date().toISOString(),
          tables: {
            companies: this.getLocalMockStore("companies", []),
            products: this.getLocalMockStore("products", []),
            categories: this.getLocalMockStore("categories", []),
            brands: this.getLocalMockStore("brands", []),
            suppliers: this.getLocalMockStore("suppliers", []),
            customers: this.getLocalMockStore("customers", []),
            sales: this.getLocalMockStore("sales", []),
            purchases: this.getLocalMockStore("purchases", []),
          },
        }
      }
      this.handleError(error, "settings.export_backup")
    }
  }
}

export const settingsService = SettingsService.getInstance()
