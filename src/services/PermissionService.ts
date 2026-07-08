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
    try {
      const { data, error } = await this.supabase.from("permissions").select("*").order("name")
      if (error) throw error
      return (data as Permission[]) || []
    } catch (error) {
      this.handleError(error)
    }
  }

  public async listForRole(roleId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from("role_permissions")
        .select("permission_id")
        .eq("role_id", roleId)

      if (error) throw error
      return (data || []).map((row) => row.permission_id as string)
    } catch (error) {
      this.handleError(error)
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
      this.handleError(error)
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
      this.handleError(error)
    }
  }
}

export const permissionService = PermissionService.getInstance()
