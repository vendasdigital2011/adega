import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Regressão da auditoria "reviravolta" (achado P3): bloquear um usuário
// (users.status) não derrubava uma sessão já aberta — o middleware só
// validava o JWT (auth.getUser()), nunca reconsultava o status, então o
// usuário bloqueado seguia acessando o sistema normalmente até o token
// expirar (~1h). Este teste prova que uma sessão com status != 'active' é
// redirecionada e desconectada na PRÓXIMA requisição, não só no próximo login.
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logServer: vi.fn(),
  generateRequestId: () => "req_test",
}))

import { createServerClient } from "@supabase/ssr"
import { middleware } from "@/middleware"

function mockSupabaseClient(status: string | null, permission = true) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: status ? { status } : null }),
        })),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ data: permission }),
  }
}

describe("middleware — revogação de sessão de usuário bloqueado", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("usuário com status 'blocked' é desconectado e redirecionado ao login numa rota protegida", async () => {
    const client = mockSupabaseClient("blocked")
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(client)

    const request = new NextRequest("http://localhost:3000/dashboard")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/login")
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  it("usuário com status 'inactive' também é desconectado (não só 'blocked')", async () => {
    const client = mockSupabaseClient("inactive")
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(client)

    const request = new NextRequest("http://localhost:3000/sales")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/login")
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  it("usuário com status 'active' passa normalmente, sem signOut", async () => {
    const client = mockSupabaseClient("active")
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(client)

    const request = new NextRequest("http://localhost:3000/dashboard")
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(client.auth.signOut).not.toHaveBeenCalled()
  })

  it("linha de defesa: perfil não encontrado (null) também é tratado como bloqueado, nunca deixa passar", async () => {
    const client = mockSupabaseClient(null)
    ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue(client)

    const request = new NextRequest("http://localhost:3000/dashboard")
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/login")
  })
})
