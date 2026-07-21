import { describe, it, expect, vi } from "vitest"

// Regressão da auditoria de logging: AuthService.getCurrentUserProfile tinha
// um fallback que fabricava um perfil "Administrador" com permissões
// completas sempre que a consulta real ao perfil falhasse. Este teste prova
// que, com a query de perfil forçada a falhar, getCurrentUser() retorna
// null — nunca um perfil fabricado.
const failingQuery: any = {
  then: (resolve: (v: unknown) => void) =>
    resolve({ data: null, error: { message: "erro simulado", code: "PGRST000" } }),
}
for (const method of ["select", "eq"]) {
  failingQuery[method] = vi.fn(() => failingQuery)
}
failingQuery.single = vi.fn(() => Promise.resolve({ data: null, error: { message: "erro simulado" } }))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => failingQuery),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } }, error: null })),
    },
  },
}))

import { authService } from "@/services/AuthService"

describe("AuthService — sem fallback fabricado", () => {
  it("getCurrentUser() retorna null quando a query de perfil falha (nunca um mock Administrador)", async () => {
    const user = await authService.getCurrentUser()
    expect(user).toBeNull()
  })
})
