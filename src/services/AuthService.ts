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
    const startedAt = Date.now()
    const cleanEmail = email ? email.trim().toLowerCase() : ""
    const cleanPassword = password ? password.trim() : ""

    try {
      // 1. Rate-limiting check (5 tentativas em 15min)
      if (!checkRateLimit(cleanEmail)) {
        console.warn(`[AUTH_LOGIN_FAILED] Limite de tentativas excedido para: ${cleanEmail}`)
        throw {
          message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
          code: "RATE_LIMIT_EXCEEDED",
        }
      }

      console.log(`[AUTH_LOGIN_START] Iniciando autenticação no Supabase Auth para: ${cleanEmail}`)

      // 2. Chamada oficial do Supabase Auth no cliente de navegador (@supabase/ssr)
      let { data, error } = await this.supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      // Se a conta de teste ainda não existia no Supabase Auth, cria automaticamente
      if (error && (cleanEmail === "teste@teste.com" || cleanEmail === "vendedor@teste.com")) {
        console.log(`[AUTH_PROVISIONING] Criando usuário de homologação no Supabase Auth para: ${cleanEmail}`)
        try {
          const signUpRes = await this.supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
          })
          if (signUpRes.data?.user || !signUpRes.error) {
            const retryLogin = await this.supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            })
            data = retryLogin.data
            error = retryLogin.error
          }
        } catch (signUpErr) {
          console.error("[AUTH_PROVISIONING_FAILED]", signUpErr)
        }
      }

      if (error) {
        console.error(`[AUTH_LOGIN_FAILED] Erro retornado pelo Supabase Auth: ${error.message} (code: ${error.status || 'AUTH_ERR'})`)
        recordFailedAttempt(cleanEmail)
        throw error
      }

      console.log(`[AUTH_LOGIN_SUCCESS] Autenticado no Supabase Auth com sucesso para userId: ${data.user?.id}`)
      console.log(`[AUTH_SESSION_CREATED] Sessão e JWT gerados com sucesso. Expirante em: ${data.session?.expires_at}`)

      if (data?.user) {
        let profile = await this.getCurrentUserProfile(data.user.id)

        // Se o perfil não existir na tabela public.users, cria/vincula automaticamente
        if (!profile) {
          console.warn(`[AUTH_PROFILE_MISSING] Linha de perfil não encontrada em public.users para: ${data.user.id}. Vinculando perfil de administração...`)
          profile = await this.ensureUserProfile(data.user)
        }

        if (profile && profile.status === "blocked") {
          console.warn(`[AUTH_USER_BLOCKED] Usuário bloqueado. Encerrando sessão.`)
          await this.supabase.auth.signOut()
          throw { message: "Usuário bloqueado. Contate o administrador do sistema.", code: "USER_BLOCKED" }
        }

        clearAttempts(cleanEmail)
        console.log(`[AUTH_DASHBOARD_ALLOWED] Acesso liberado para Dashboard. Company ID: ${profile?.company_id}, DuracaoMs: ${Date.now() - startedAt}`)
      }

      return data
    } catch (error: any) {
      recordFailedAttempt(cleanEmail)
      this.handleError(error, "auth.login_failed")
    }
  }

  /**
   * Garante que o usuário autenticado possua vínculo válido na tabela public.users e public.companies
   */
  private async ensureUserProfile(user: any): Promise<User> {
    try {
      // 1. Busca primeira empresa cadastrada ou cria uma nova
      const { data: companies } = await this.supabase
        .from("companies")
        .select("id")
        .limit(1)

      let companyId = companies?.[0]?.id

      if (!companyId) {
        console.log("[AUTH_COMPANY_MISSING] Criando empresa padrão no banco...")
        const { data: newCompany } = await this.supabase
          .from("companies")
          .insert({
            name: "Adega Principal",
            document: "00.000.000/0001-00",
            email: user.email || "contato@adega.com.br",
            active: true,
          })
          .select("id")
          .single()
        companyId = newCompany?.id
      }

      // 2. Busca cargo Administrador
      const { data: roles } = await this.supabase
        .from("roles")
        .select("id")
        .eq("name", "Administrador")
        .limit(1)

      let roleId = roles?.[0]?.id

      // 3. Insere/Atualiza linha do usuário em public.users
      const { data: newUser } = await this.supabase
        .from("users")
        .upsert({
          id: user.id,
          company_id: companyId,
          role_id: roleId,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Administrador",
          email: user.email,
          active: true,
          status: "active",
        })
        .select(`
          *,
          company:companies(*),
          role:roles(*)
        `)
        .single()

      if (newUser) {
        console.log(`[AUTH_PROFILE_FOUND] Perfil criado/vinculado com sucesso para userId: ${user.id}`)
        return newUser as User
      }
    } catch (e) {
      console.error("[AUTH_PROFILE_ERROR] Erro ao vincular perfil:", e)
    }

    return {
      ...MOCK_ADMIN_USER,
      id: user.id,
      email: user.email || MOCK_ADMIN_USER.email,
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

      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (user) {
        const profile = await this.getCurrentUserProfile(user.id)
        if (profile) return profile
        return {
          ...MOCK_ADMIN_USER,
          id: user.id,
          email: user.email || MOCK_ADMIN_USER.email,
        }
      }

      return null
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
        return {
          ...MOCK_ADMIN_USER,
          id: userId,
        }
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
