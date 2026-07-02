import { BaseService } from "./BaseService"
import { User, Company, Role, Permission } from "@/types"

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
        
        if (profile) {
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
        }
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
      console.error("Error getting current user:", error)
      return null
    }
  }

  /**
   * Fetch user details from database with mock failovers for development
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
        console.warn("Could not load user from DB, falling back to mock details for dev:", userError?.message)
        return this.getMockProfile(userId)
      }

      // 2. Fetch permissions for the user's role
      let permissions: Permission[] = []
      if (userData.role_id) {
        const { data: permData, error: permError } = await this.supabase
          .from("role_permissions")
          .select("permission:permissions(*)")
          .eq("role_id", userData.role_id)

        if (!permError && permData) {
          permissions = permData
            .map((p: any) => p.permission)
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
        active: userData.active ?? true,
        last_login: userData.last_login || null,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        company: userData.company,
        role: userData.role,
        permissions,
      }
    } catch (error) {
      console.warn("Fallback to mock details due to exception:", error)
      return this.getMockProfile(userId)
    }
  }

  /**
   * Mock user profile fallback for initial stage/missing DB tables
   */
  private getMockProfile(userId: string): User {
    const mockCompany: Company = {
      id: "mock-company-id",
      name: "Adega Modelo",
      document: "12.345.678/0001-99",
      email: "contato@adegamodelo.com.br",
      phone: "(11) 99999-9999",
      address: "Av. Principal, 1000",
      city: "São Paulo",
      state: "SP",
      zip_code: "01001-000",
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockRole: Role = {
      id: "mock-admin-role-id",
      name: "Administrador",
      description: "Acesso total ao sistema",
    }

    const mockPermissions: Permission[] = [
      { id: "p1", name: "dashboard.view", description: "Ver dashboard" },
      { id: "p2", name: "products.view", description: "Ver produtos" },
      { id: "p3", name: "products.create", description: "Criar produtos" },
      { id: "p4", name: "products.edit", description: "Editar produtos" },
      { id: "p5", name: "products.delete", description: "Excluir produtos" },
      { id: "p6", name: "sales.create", description: "Realizar vendas" },
      { id: "p7", name: "cash.manage", description: "Gerenciar caixa" },
    ]

    return {
      id: userId,
      company_id: mockCompany.id,
      role_id: mockRole.id,
      name: "Administrador Adega",
      email: "admin@adegacloud.com.br",
      phone: "(11) 99999-8888",
      active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      company: mockCompany,
      role: mockRole,
      permissions: mockPermissions,
    }
  }
}

export const authService = AuthService.getInstance()
