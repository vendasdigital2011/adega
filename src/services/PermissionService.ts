import { BaseService } from "./BaseService"
import { Permission } from "@/types"

export class PermissionService extends BaseService {
  private static instance: PermissionService

  private constructor() {
    super()
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService()
    }
    return PermissionService.instance
  }

  public async listAll(): Promise<Permission[]> {
    const modules = [
      { key: "dashboard", label: "Dashboard" },
      { key: "products", label: "Produtos" },
      { key: "categories", label: "Categorias" },
      { key: "inventory", label: "Estoque" },
      { key: "purchases", label: "Compras" },
      { key: "sales", label: "Vendas" },
      { key: "customers", label: "Clientes" },
      { key: "suppliers", label: "Fornecedores" },
      { key: "financial", label: "Financeiro" },
      { key: "cash", label: "Caixa" },
      { key: "reports", label: "Relatórios" },
      { key: "settings", label: "Configurações" },
      { key: "users", label: "Usuários" },
      { key: "ai", label: "Inteligência Artificial" },
    ]

    const actions = [
      { key: "view", label: "Visualizar" },
      { key: "create", label: "Criar" },
      { key: "edit", label: "Editar" },
      { key: "delete", label: "Excluir" },
      { key: "import", label: "Importar" },
      { key: "export", label: "Exportar" },
      { key: "approve", label: "Aprovar" },
      { key: "cancel", label: "Cancelar" },
    ]

    const initialMock: Permission[] = []
    let idCounter = 1

    for (const mod of modules) {
      for (const act of actions) {
        initialMock.push({
          id: `p_${mod.key}_${act.key}`,
          name: `${mod.key}.${act.key}`,
          description: `${act.label} ${mod.label}`,
        })
        idCounter++
      }
    }

    if (this.isOfflineOrDemoMode()) {
      return this.getLocalMockStore("permissions", initialMock)
    }

    try {
      const { data, error } = await this.supabase.from("permissions").select("*").order("name")
      if (error) throw error
      return (data as Permission[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        return this.getLocalMockStore("permissions", initialMock)
      }
      this.handleError(error, "permissions.listAll")
    }
  }

  public async listForRole(roleId: string): Promise<string[]> {
    if (this.isOfflineOrDemoMode()) {
      const allPerms = await this.listAll()
      const initialGranted = allPerms.map((p) => p.id)
      return this.getLocalMockStore(`role_permissions_${roleId}`, initialGranted)
    }

    try {
      const { data, error } = await this.supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", roleId)

      if (error) throw error
      return (data || []).map((row) => row.permission_id as string)
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const allPerms = await this.listAll()
        const initialGranted = allPerms.map((p) => p.id)
        return this.getLocalMockStore(`role_permissions_${roleId}`, initialGranted)
      }
      this.handleError(error, "permissions.list_for_role")
    }
  }

  public async grant(roleId: string, permissionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("role_permissions")
        .insert({ role_id: roleId, permission_id: permissionId })
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "role_permissions", roleId, null, {
        granted: permissionId,
      })
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const current = await this.listForRole(roleId)
        if (!current.includes(permissionId)) {
          current.push(permissionId)
          this.saveLocalMockStore(`role_permissions_${roleId}`, current)
        }
        return
      }
      this.handleError(error, "permissions.grant")
    }
  }

  public async revoke(roleId: string, permissionId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("permission_id", permissionId)
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "role_permissions", roleId, null, {
        revoked: permissionId,
      })
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) {
        const current = await this.listForRole(roleId)
        const updated = current.filter((id) => id !== permissionId)
        this.saveLocalMockStore(`role_permissions_${roleId}`, updated)
        return
      }
      this.handleError(error, "permissions.revoke")
    }
  }
}

export const permissionService = PermissionService.getInstance()
