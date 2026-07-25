import { BaseService } from "./BaseService"

export interface KeyboardShortcut {
  id: string
  company_id: string
  role_id: string | null
  name: string
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  enabled: boolean
  action: string
  description: string | null
  module: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateShortcutInput {
  role_id?: string | null
  name: string
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  enabled?: boolean
  action: string
  description?: string | null
  module?: string | null
}

export interface UpdateShortcutInput extends Partial<CreateShortcutInput> {}

export interface ShortcutConflict {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  count: number
  shortcuts_json: Array<{ id: string; action: string; name: string }>
}

const SELECT_FIELDS = `
  *
`

export class KeyboardShortcutService extends BaseService {
  private static instance: KeyboardShortcutService

  private constructor() {
    super()
  }

  public static getInstance(): KeyboardShortcutService {
    if (!KeyboardShortcutService.instance) {
      KeyboardShortcutService.instance = new KeyboardShortcutService()
    }
    return KeyboardShortcutService.instance
  }

  public async list(module?: string | null): Promise<KeyboardShortcut[]> {
    try {
      const companyId = await this.getCurrentUserCompanyId()

      let query = this.supabase
        .from("keyboard_shortcuts")
        .select(SELECT_FIELDS)
        .eq("company_id", companyId)
        .order("module", { ascending: true })
        .order("name", { ascending: true })

      if (module) {
        query = query.or(`module.eq.${module},module.is.null`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data as unknown as KeyboardShortcut[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateShortcutInput): Promise<KeyboardShortcut> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const userId = await this.getCurrentUserId()

      // Detectar conflitos antes de criar
      const conflicts = await this.detectConflicts()
      const newShortcutKey = `${input.key}${input.ctrl ? "+Ctrl" : ""}${input.shift ? "+Shift" : ""}${input.alt ? "+Alt" : ""}`

      for (const conflict of conflicts) {
        const existingKey = `${conflict.key}${conflict.ctrl ? "+Ctrl" : ""}${conflict.shift ? "+Shift" : ""}${conflict.alt ? "+Alt" : ""}`
        if (existingKey === newShortcutKey && input.enabled !== false) {
          throw {
            message: `Conflito detectado: já existe um atalho para ${existingKey}`,
            code: "SHORTCUT_CONFLICT",
          }
        }
      }

      const { data, error } = await this.supabase
        .from("keyboard_shortcuts")
        .insert({
          company_id: companyId,
          created_by: userId,
          ...this.normalize(input),
        })
        .select(SELECT_FIELDS)
        .single()

      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "keyboard_shortcuts", data.id, null, input)
      return data as unknown as KeyboardShortcut
    } catch (error) {
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateShortcutInput): Promise<KeyboardShortcut> {
    try {
      const { data, error } = await this.supabase
        .from("keyboard_shortcuts")
        .update({ ...this.normalize(input), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select(SELECT_FIELDS)
        .single()

      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "keyboard_shortcuts", id, null, input)
      return data as unknown as KeyboardShortcut
    } catch (error) {
      this.handleError(error)
    }
  }

  public async toggleEnabled(id: string, enabled: boolean): Promise<KeyboardShortcut> {
    return this.update(id, { enabled })
  }

  public async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("keyboard_shortcuts").delete().eq("id", id)

      if (error) throw error
      await this.auditAsCurrentUser("DELETE", "keyboard_shortcuts", id)
    } catch (error) {
      this.handleError(error)
    }
  }

  public async detectConflicts(): Promise<ShortcutConflict[]> {
    try {
      const companyId = await this.getCurrentUserCompanyId()

      const { data, error } = await this.supabase.rpc("detect_shortcut_conflicts", {
        p_company_id: companyId,
      })

      if (error) throw error
      return (data as unknown as ShortcutConflict[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async restoreDefaults(roleId?: string | null): Promise<void> {
    try {
      const companyId = await this.getCurrentUserCompanyId()

      const { error } = await this.supabase.rpc("restore_default_shortcuts", {
        p_company_id: companyId,
        p_role_id: roleId || null,
      })

      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "keyboard_shortcuts", "restore_defaults", null, {
        roleId,
      })
    } catch (error) {
      this.handleError(error)
    }
  }

  public async exportAsJson(): Promise<string> {
    try {
      const shortcuts = await this.list()
      return JSON.stringify(shortcuts, null, 2)
    } catch (error) {
      this.handleError(error)
    }
  }

  private normalize<T extends object>(input: T): T {
    const out = { ...(input as Record<string, unknown>) }
    const nullableKeys = ["role_id", "description", "module"]
    for (const key of nullableKeys) {
      if (key in out && (out[key] === "" || out[key] === undefined)) {
        out[key] = null
      }
    }
    return out as T
  }
}

export const keyboardShortcutService = KeyboardShortcutService.getInstance()
