import { describe, it, expect, vi } from "vitest"

// Mocka o client singleton para forçar o caminho de erro (catch → handleError)
// de forma determinística — os testes de integração passam pelo Supabase
// real, então só exercitam esse branch quando algo falha de verdade, o que
// não é garantido a cada execução.
const mockError = { message: "Erro simulado de rede", code: "PGRST000" }

// O PostgrestFilterBuilder real do supabase-js é "thenable" em qualquer
// ponto da cadeia (select().order().range() ou só select().order(), etc.) —
// o mock precisa da mesma propriedade, senão `await query` nos métodos que
// não chamam .range() por último recebe o builder em vez do resultado.
function makeFailingQuery() {
  const query: any = {
    then: (resolve: (v: unknown) => void) => resolve({ data: null, error: mockError, count: null }),
  }
  for (const method of ["select", "order", "range", "eq", "or", "ilike"]) {
    query[method] = vi.fn(() => query)
  }
  return query
}

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => makeFailingQuery()),
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })) },
    rpc: vi.fn(() => Promise.resolve({ data: null, error: mockError })),
  },
}))

import { categoryService } from "@/services/CategoryService"
import { roleService } from "@/services/RoleService"
import { userService } from "@/services/UserService"

describe("Tratamento de erro compartilhado (BaseService.handleError)", () => {
  it("CategoryService.list propaga a mensagem/código do erro do Supabase", async () => {
    await expect(categoryService.list({ page: 1, limit: 10 })).rejects.toMatchObject({
      message: mockError.message,
      code: mockError.code,
    })
  })

  it("RoleService.list propaga o erro pelo mesmo caminho", async () => {
    await expect(roleService.list()).rejects.toMatchObject({ message: mockError.message })
  })

  it("UserService.list propaga o erro pelo mesmo caminho", async () => {
    await expect(userService.list({ page: 1, limit: 10 })).rejects.toMatchObject({ message: mockError.message })
  })
})
