import { BaseService } from "./BaseService"
import { User, Permission } from "@/types"
import { logClientError } from "@/lib/logger"

export class AuthService extends BaseService {
  private static instance: AuthService

  private constructor() {
    super()
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Log in user with email and password
   */
  public async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data?.user) {
        // Fetch detailed profile
        const profile = await this.getCurrentUserProfile(data.user.id)

        // Sem perfil não dá pra saber o status/empresa/permissões reais do
        // usuário — nunca deixa passar sem essa verificação (ver auditoria
        // de logging: um fallback anterior fabricava um perfil Administrador
        // aqui, o que mascarava exatamente esse tipo de falha).
        if (!profile) {
          await this.supabase.auth.signOut()
          throw {
            message: "Não foi possível carregar seu perfil. Tente novamente em instantes.",
            code: "PROFILE_LOAD_FAILED",
          }
        }

        if (profile.status !== "active") {
          await this.supabase.auth.signOut()
          throw { message: "Usuário inativo ou bloqueado. Contate o administrador." }
        }

        // Log audit action
        await this.createAuditLog(
          profile.company_id,
          profile.id,
          "LOGIN",
          "users",
          profile.id,
          null,
          { email }
        )
        await this.supabase
          .from("users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", profile.id)
      }

      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Log out current user
   */
  public async signOut() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (user) {
        // Load profile to get company ID for logs
        const profile = await this.getCurrentUserProfile(user.id)
        if (profile) {
          await this.createAuditLog(
            profile.company_id,
            profile.id,
            "LOGOUT",
            "users",
            profile.id
          )
        }
      }

      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Send password reset email
   */
  public async forgotPassword(email: string, redirectTo: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Update password for current authenticated user
   */
  public async updatePassword(password: string) {
    try {
      const { data, error } = await this.supabase.auth.updateUser({
        password,
      })
      if (error) throw error

      if (data?.user) {
        const profile = await this.getCurrentUserProfile(data.user.id)
        if (profile) {
          await this.createAuditLog(
            profile.company_id,
            profile.id,
            "PASSWORD_CHANGE",
            "users",
            profile.id
          )
        }
      }

      return { success: true }
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Refresh current active session
   */
  public async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()
      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Fetch current user and join with company, roles and permissions
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error || !user) return null

      const profile = await this.getCurrentUserProfile(user.id)
      return profile
    } catch (error) {
      logClientError("auth.getCurrentUser", error)
      return null
    }
  }

  /**
   * Fetch user details (profile + role + permissions) from the database.
   * Returns null on any failure — the caller must treat that as "not
   * authenticated", never fabricate a profile to fall back on.
   */
  private async getCurrentUserProfile(userId: string): Promise<User | null> {
    try {
      // 1. Try fetching from database
      const { data: userData, error: userError } = await this.supabase
        .from("users")
        .select(`
          *,
          company:companies(*),
          role:roles(*)
        `)
        .eq("id", userId)
        .single()

      if (userError || !userData) {
        logClientError("auth.getCurrentUserProfile.not_found", userError, { userId })
        return null
      }

      // 2. Fetch permissions for the user's role
      let permissions: Permission[] = []
      if (userData.role_id) {
        const { data: permData, error: permError } = await this.supabase
          .from("role_permissions")
          .select("permission:permissions(*)")
          .eq("role_id", userData.role_id)

        if (!permError && permData) {
          permissions = (permData as unknown as { permission: Permission | null }[])
            .map((p) => p.permission)
            .filter((p): p is Permission => !!p)
        }
      }

      return {
        id: userData.id,
        company_id: userData.company_id,
        role_id: userData.role_id,
        name: userData.name || "Usuário",
        email: userData.email,
        phone: userData.phone || null,
        status: userData.status ?? "active",
        last_login: userData.last_login || null,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        company: userData.company,
        role: userData.role,
        permissions,
      }
    } catch (error) {
      logClientError("auth.getCurrentUserProfile.exception", error, { userId })
      return null
    }
  }
}

export const authService = AuthService.getInstance()
