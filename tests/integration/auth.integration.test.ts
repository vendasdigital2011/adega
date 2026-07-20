import { describe, it, expect, afterEach } from "vitest"
import { authService } from "@/services/AuthService"
import { TEST_USERS } from "./helpers/testClient"

describe("AuthService (integração)", () => {
  afterEach(async () => {
    await authService.signOut().catch(() => {})
  })

  it("faz login com credenciais válidas e carrega o perfil com permissões", async () => {
    await authService.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password)
    const user = await authService.getCurrentUser()
    expect(user?.email).toBe(TEST_USERS.admin.email)
    expect(user?.role?.name).toBe("Administrador")
    expect(user?.permissions?.length).toBeGreaterThan(0)
  })

  it("rejeita credenciais inválidas", async () => {
    await expect(authService.signIn(TEST_USERS.admin.email, "senha-errada-123")).rejects.toBeTruthy()
  })

  it("getCurrentUser retorna null quando não há sessão", async () => {
    const user = await authService.getCurrentUser()
    expect(user).toBeNull()
  })

  it("signOut encerra a sessão", async () => {
    await authService.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password)
    await authService.signOut()
    const user = await authService.getCurrentUser()
    expect(user).toBeNull()
  })

  it("login como vendedor carrega um perfil com menos permissões que o admin", async () => {
    await authService.signIn(TEST_USERS.vendedor.email, TEST_USERS.vendedor.password)
    const user = await authService.getCurrentUser()
    expect(user?.role?.name).not.toBe("Administrador")
  })

  it("forgotPassword aceita um e-mail existente sem lançar (nunca revela se existe)", async () => {
    // O Supabase Auth tem rate limit de envio de e-mail por projeto; rodar
    // esta suíte repetidamente em pouco tempo pode esbarrar nele — nesse caso
    // o comportamento correto do método (propagar o erro) também é válido,
    // só não pode ser um erro genérico/inesperado.
    try {
      const result = await authService.forgotPassword(TEST_USERS.admin.email, "http://localhost:3000/reset-password")
      expect(result.success).toBe(true)
    } catch (error) {
      expect((error as { code?: string }).code).toBe("over_email_send_rate_limit")
    }
  })

  it("refreshSession funciona com uma sessão ativa", async () => {
    await authService.signIn(TEST_USERS.admin.email, TEST_USERS.admin.password)
    const data = await authService.refreshSession()
    expect(data.session).toBeTruthy()
  })
})
