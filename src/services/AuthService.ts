import { BaseService } from "./BaseService"
import { User, Permission } from "@/types"
import { logClientError } from "@/lib/logger"
const MOCK_ADMIN_USER: User = {
  id: "f6928173-b3e0-49ec-bc8f-9d00b46acaa6",
  company_id: "c1111111-1111-1111-1111-111111111111",
  role_id: "r1111111-1111-1111-1111-111111111111",
  name: "Administrador Teste",
  email: "teste@teste.com",
  phone: "(11) 99999-9999",
  status: "active",
  two_fa_enabled: false,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  company: {
    id: "c1111111-1111-1111-1111-111111111111",
    name: "Adega Modelo",
    document: "12.345.678/0001-99",
    email: "contato@adegamodelo.com.br",
    phone: "(11) 3333-4444",
    address: "Rua das Adegas, 100",
    city: "São Paulo",
    state: "SP",
    zip_code: "01000-000",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  role: {
    id: "r1111111-1111-1111-1111-111111111111",
    company_id: "c1111111-1111-1111-1111-111111111111",
    name: "Administrador",
    description: "Acesso total ao sistema",
  },
  permissions: [
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
  ],
}

const MOCK_VENDEDOR_USER: User = {
  ...MOCK_ADMIN_USER,
  id: "v2222222-2222-2222-2222-222222222222",
  name: "Vendedor Teste",
  email: "vendedor@teste.com",
  role: {
    id: "r2222222-2222-2222-2222-222222222222",
    company_id: "c1111111-1111-1111-1111-111111111111",
    name: "Vendedor",
    description: "Vendas e clientes",
  },
  permissions: [
    { id: "p1", name: "dashboard.view", description: "Ver dashboard" },
    { id: "p2", name: "products.view", description: "Ver produtos" },
    { id: "p3", name: "sales.create", description: "Realizar vendas" },
    { id: "p4", name: "cash.manage", description: "Gerenciar caixa" },
  ],
}

// Rate-limiting simples em-memória (Etapa 7.4): rastreia 5 tentativas falhadas
// em 15 minutos por email. Em produção, use Redis ou similar.
interface LoginAttempt {
  count: number
  firstAttempt: number
}

const loginAttempts = new Map<string, LoginAttempt>()
const MAX_ATTEMPTS = 5
const TIME_WINDOW = 15 * 60 * 1000 // 15 minutos

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(email)

  if (!attempt) {
    loginAttempts.set(email, { count: 0, firstAttempt: now })
    return true
  }

  // Se a janela passou, reseta
  if (now - attempt.firstAttempt > TIME_WINDOW) {
    loginAttempts.set(email, { count: 0, firstAttempt: now })
    return true
  }

  // Se já atingiu o limite, bloqueia
  if (attempt.count >= MAX_ATTEMPTS) {
    return false
  }

  return true
}

function recordFailedAttempt(email: string): void {
  const attempt = loginAttempts.get(email)
  if (attempt) {
    attempt.count++
  } else {
    loginAttempts.set(email, { count: 1, firstAttempt: Date.now() })
  }
}

function clearAttempts(email: string): void {
  loginAttempts.delete(email)
}

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
      // Etapa 7.4: Rate-limiting (5 tentativas em 15 minutos)
      if (!checkRateLimit(email)) {
        throw {
          message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
          code: "RATE_LIMIT_EXCEEDED",
        }
      }

      let data, error
      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL
      const isBypass = process.env.NEXT_PUBLIC_BYPASS_MIDDLEWARE === "true"

      if ((isPlaceholder || isBypass) && process.env.NODE_ENV !== "test") {
        const isDemoAdmin = email === "teste@teste.com" && password === "teste1234"
        const isDemoVendedor = email === "vendedor@teste.com" && password === "vendedor1234"

        if (isDemoAdmin || isDemoVendedor) {
          const mock = isDemoVendedor ? MOCK_VENDEDOR_USER : MOCK_ADMIN_USER
          if (typeof window !== "undefined") {
            localStorage.setItem("adega_demo_user", JSON.stringify(mock))
            document.cookie = `adega_demo_user=${encodeURIComponent(JSON.stringify(mock))}; path=/; max-age=86400; SameSite=Lax`
          }
          clearAttempts(email)
          return { user: mock }
        }

        recordFailedAttempt(email)
        logClientError(
          "Invalid login credentials",
          "auth.login_failed",
          { email }
        )
        throw { message: "E-mail ou senha inválidos.", code: "INVALID_CREDENTIALS" }
      }

      try {
        const res = await this.supabase.auth.signInWithPassword({
          email,
          password,
        })
        data = res.data
        error = res.error
      } catch (err: any) {
        if (
          typeof window !== "undefined" &&
          (err?.message?.includes("fetch") || isPlaceholder || isBypass)
        ) {
          const isDemoAdmin = email === "teste@teste.com" && password === "teste1234"
          const isDemoVendedor = email === "vendedor@teste.com" && password === "vendedor1234"
          if (isDemoAdmin || isDemoVendedor) {
            const mock = isDemoVendedor ? MOCK_VENDEDOR_USER : MOCK_ADMIN_USER
            localStorage.setItem("adega_demo_user", JSON.stringify(mock))
            document.cookie = `adega_demo_user=${encodeURIComponent(JSON.stringify(mock))}; path=/; max-age=86400; SameSite=Lax`
            clearAttempts(email)
            return { user: mock }
          }
        }
        throw err
      }

      if (error) {
        // Se for erro de rede/fetch e for uma das credenciais de teste oficiais do sistema
        const isDemoAdmin = email === "teste@teste.com" && password === "teste1234"
        const isDemoVendedor = email === "vendedor@teste.com" && password === "vendedor1234"
        const isNetworkOrPlaceholderError =
          error.message?.toLowerCase().includes("fetch") ||
          error.message?.toLowerCase().includes("failed") ||
          process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")

        if (typeof window !== "undefined" && (isDemoAdmin || isDemoVendedor) && isNetworkOrPlaceholderError) {
          const mock = isDemoVendedor ? MOCK_VENDEDOR_USER : MOCK_ADMIN_USER
          localStorage.setItem("adega_demo_user", JSON.stringify(mock))
          document.cookie = `adega_demo_user=${encodeURIComponent(JSON.stringify(mock))}; path=/; max-age=86400; SameSite=Lax`
          clearAttempts(email)
          return { user: mock }
        }

        recordFailedAttempt(email)
        throw error
      }

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

        // Login successful — clear rate limit for this email
        clearAttempts(email)

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
      // Etapa 7.4: Record failed attempt for rate-limiting
      recordFailedAttempt(email)

      // Achado P5 da auditoria "reviravolta": falha de login precisa ser
      // auditável (detecção de força bruta), mas não dá pra gravar em
      // audit_logs — essa tabela exige company_id, e numa falha de login
      // (senha errada, e-mail inexistente) ainda não sabemos a empresa do
      // usuário, e a policy de audit_logs/users exige sessão autenticada
      // pra sequer consultar isso. Fica registrado com uma action própria
      // e filtrável no logger estruturado (Vercel/stdout), em vez de cair
      // no balde genérico "service.error".
      this.handleError(error, "auth.login_failed")
    }
  }

  /**
   * Log out current user
   */
  public async signOut() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("adega_demo_user")
        document.cookie = "adega_demo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
      }

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
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("adega_demo_user")
        if (stored && stored.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed && parsed.email) return parsed as User
          } catch (e) {}
        }
      }

      const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL
      const isBypass = process.env.NEXT_PUBLIC_BYPASS_MIDDLEWARE === "true"

      if ((isPlaceholder || isBypass) && process.env.NODE_ENV !== "test") {
        return null
      }

      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error || !user) return null

      const profile = await this.getCurrentUserProfile(user.id)
      return profile
    } catch (error) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("adega_demo_user")
        if (stored && stored.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed && parsed.email) return parsed as User
          } catch (e) {}
        }
      }
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
        two_fa_enabled: userData.two_fa_enabled ?? false,
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
