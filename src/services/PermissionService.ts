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
    const initialMock: Permission[] = [
      { id: "p1", name: "dashboard.view", description: "Ver dashboard" },
      { id: "p2", name: "products.view", description: "Ver produtos" },
      { id: "p2_c", name: "products.create", description: "Criar produtos" },
      { id: "p2_e", name: "products.edit", description: "Editar produtos" },
      { id: "p2_d", name: "products.delete", description: "Excluir produtos" },
      { id: "p3", name: "categories.view", description: "Ver categorias" },
      { id: "p3_c", name: "categories.create", description: "Criar categorias" },
      { id: "p3_e", name: "categories.edit", description: "Editar categorias" },
      { id: "p3_d", name: "categories.delete", description: "Excluir categorias" },
      { id: "p4", name: "brands.view", description: "Ver marcas" },
      { id: "p4_c", name: "brands.create", description: "Criar marcas" },
      { id: "p4_e", name: "brands.edit", description: "Editar marcas" },
      { id: "p4_d", name: "brands.delete", description: "Excluir marcas" },
      { id: "p5", name: "suppliers.view", description: "Ver fornecedores" },
      { id: "p5_c", name: "suppliers.create", description: "Criar fornecedores" },
      { id: "p5_e", name: "suppliers.edit", description: "Editar fornecedores" },
      { id: "p5_d", name: "suppliers.delete", description: "Excluir fornecedores" },
      { id: "p6", name: "customers.view", description: "Ver clientes" },
      { id: "p6_c", name: "customers.create", description: "Criar clientes" },
      { id: "p6_e", name: "customers.edit", description: "Editar clientes" },
      { id: "p6_d", name: "customers.delete", description: "Excluir clientes" },
      { id: "p7", name: "inventory.view", description: "Ver estoque" },
      { id: "p7_c", name: "inventory.create", description: "Movimentar estoque" },
      { id: "p8", name: "purchases.view", description: "Ver compras" },
      { id: "p8_c", name: "purchases.create", description: "Criar compras" },
      { id: "p8_a", name: "purchases.approve", description: "Aprovar compras" },
      { id: "p8_x", name: "purchases.cancel", description: "Cancelar compras" },
      { id: "p9", name: "sales.view", description: "Ver vendas" },
      { id: "p9_c", name: "sales.create", description: "Criar vendas" },
      { id: "p9_x", name: "sales.cancel", description: "Cancelar vendas" },
      { id: "p10", name: "cash.view", description: "Ver caixa" },
      { id: "p10_m", name: "cash.manage", description: "Gerenciar caixa" },
      { id: "p10_a", name: "cash.approve", description: "Aprovar caixa" },
      { id: "p10_c", name: "cash.create", description: "Abrir caixa" },
      { id: "p11", name: "financial.view", description: "Ver financeiro" },
      { id: "p11_c", name: "financial.create", description: "Criar financeiro" },
      { id: "p11_e", name: "financial.edit", description: "Editar financeiro" },
      { id: "p11_a", name: "financial.approve", description: "Aprovar financeiro" },
      { id: "p12", name: "reports.view", description: "Ver relatórios" },
      { id: "p12_x", name: "reports.export", description: "Exportar relatórios" },
      { id: "p13", name: "audit.view", description: "Ver auditoria" },
      { id: "p14", name: "users.view", description: "Ver usuários" },
      { id: "p14_c", name: "users.create", description: "Criar usuários" },
      { id: "p14_e", name: "users.edit", description: "Editar usuários" },
      { id: "p14_r", name: "roles.manage", description: "Gerenciar cargos" },
      { id: "p15", name: "settings.view", description: "Ver configurações" },
      { id: "p15_e", name: "settings.edit", description: "Editar configurações" },
    ]

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
