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
    const initialMock: KeyboardShortcut[] = [
      { id: "ks-1", company_id: "c1111111-1111-1111-1111-111111111111", role_id: null, name: "Abrir Atalhos", key: "F1", ctrl: false, shift: false, alt: false, enabled: true, action: "shortcuts.help", description: "Exibe lista de atalhos", module: null, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "ks-2", company_id: "c1111111-1111-1111-1111-111111111111", role_id: null, name: "Novo Item", key: "F2", ctrl: false, shift: false, alt: false, enabled: true, action: "item.create", description: "Abre o formulário de cadastro", module: null, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "ks-3", company_id: "c1111111-1111-1111-1111-111111111111", role_id: null, name: "Buscar", key: "F3", ctrl: false, shift: false, alt: false, enabled: true, action: "search.focus", description: "Foca no campo de busca", module: null, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "ks-4", company_id: "c1111111-1111-1111-1111-111111111111", role_id: null, name: "Recarregar", key: "F5", ctrl: false, shift: false, alt: false, enabled: true, action: "page.reload", description: "Atualiza os dados da tela", module: null, created_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ]

    if (this.isOfflineOrDemoMode()) {
      const all = this.getLocalMockStore("keyboard_shortcuts", initialMock)
      if (module) {
        return all.filter((s) => s.module === module || s.module === null)
      }
      return all
    }

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
      if (this.isOfflineOrDemoMode(error)) {
        const all = this.getLocalMockStore("keyboard_shortcuts", initialMock)
        if (module) {
          return all.filter((s) => s.module === module || s.module === null)
        }
        return all
      }
      this.handleError(error, "keyboard_shortcuts.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        const list = await this.list()
        const newShortcut: KeyboardShortcut = {
          id: `ks-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          role_id: input.role_id || null,
          name: input.name,
          key: input.key,
          ctrl: input.ctrl || false,
          shift: input.shift || false,
          alt: input.alt || false,
          enabled: input.enabled ?? true,
          action: input.action,
          description: input.description || null,
          module: input.module || null,
          created_by: "f6928173-b3e0-49ec-bc8f-9d00b46acaa6",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newShortcut)
        this.saveLocalMockStore("keyboard_shortcuts", list)
        return newShortcut
      }
      this.handleError(error, "keyboard_shortcuts.create")
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
      if (this.isOfflineOrDemoMode(error)) {
        const list = await this.list()
        const idx = list.findIndex((s) => s.id === id)
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            ...input,
            updated_at: new Date().toISOString(),
          }
          this.saveLocalMockStore("keyboard_shortcuts", list)
          return list[idx]
        }
      }
      this.handleError(error, "keyboard_shortcuts.update")
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
      if (this.isOfflineOrDemoMode(error)) {
        const list = await this.list()
        const newList = list.filter((s) => s.id !== id)
        this.saveLocalMockStore("keyboard_shortcuts", newList)
        return
      }
      this.handleError(error, "keyboard_shortcuts.delete")
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
      if (this.isOfflineOrDemoMode(error)) {
        return []
      }
      this.handleError(error, "keyboard_shortcuts.detect_conflicts")
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
      if (this.isOfflineOrDemoMode(error)) {
        localStorage.removeItem("adega_mock_keyboard_shortcuts")
        return
      }
      this.handleError(error, "keyboard_shortcuts.restore_defaults")
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

  public async importFromJson(jsonString: string, options?: { mode: "merge" | "replace" }): Promise<number> {
    try {
      // Parse e validar JSON
      let importedShortcuts: Array<Partial<CreateShortcutInput>>
      try {
        importedShortcuts = JSON.parse(jsonString)
      } catch (e) {
        throw { message: "JSON inválido. Verifique o formato.", code: "INVALID_JSON" }
      }

      if (!Array.isArray(importedShortcuts)) {
        throw { message: "JSON deve ser um array de atalhos.", code: "INVALID_FORMAT" }
      }

      if (importedShortcuts.length === 0) {
        throw { message: "Nenhum atalho para importar.", code: "EMPTY_IMPORT" }
      }

      const companyId = await this.getCurrentUserCompanyId()
      const userId = await this.getCurrentUserId()
      let created = 0

      // Modo replace: deleta todos os atalhos antigos primeiro
      if (options?.mode === "replace") {
        await this.supabase.from("keyboard_shortcuts").delete().eq("company_id", companyId)
      }

      // Importar cada atalho
      for (const item of importedShortcuts) {
        // Validação mínima
        if (!item.key || !item.action) {
          continue // Skip items inválidos
        }

        try {
          // Verificar se já existe (para merge mode)
          const existing = await this.supabase
            .from("keyboard_shortcuts")
            .select("id")
            .eq("company_id", companyId)
            .eq("key", item.key)
            .eq("ctrl", item.ctrl ?? false)
            .eq("shift", item.shift ?? false)
            .eq("alt", item.alt ?? false)
            .single()

          if (existing.data && options?.mode !== "replace") {
            // Em merge mode, atualiza o existente
            await this.update(existing.data.id, item as UpdateShortcutInput)
          } else {
            // Cria novo
            await this.supabase
              .from("keyboard_shortcuts")
              .insert({
                company_id: companyId,
                created_by: userId,
                ...this.normalize(item as CreateShortcutInput),
              })
            created++
          }
        } catch (e) {
          // Continua com o próximo, não falha toda a importação
          continue
        }
      }

      await this.auditAsCurrentUser("INSERT", "keyboard_shortcuts", "import_json", null, {
        mode: options?.mode || "merge",
        itemsImported: created,
      })

      return created
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
