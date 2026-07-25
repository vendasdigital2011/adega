import { describe, it, expect, beforeAll } from "vitest"
import { supabase } from "@/lib/supabase"
import { loginAppClientAs } from "./helpers/appAuth"

// Auditoria "reviravolta" — Etapa 3 (achado P4): trava a matriz de
// permissões padrão decidida com o dono para Gerente e Vendedor
// (migration 0022), pra qualquer futura alteração acidental na matriz via
// UI ou migration quebrar este teste em vez de passar despercebida.
async function permissionsOf(roleName: string): Promise<string[]> {
  const { data: role } = await supabase.from("roles").select("id").eq("name", roleName).single()
  const { data: rows } = await supabase
    .from("role_permissions")
    .select("permission:permissions(name)")
    .eq("role_id", role!.id)
  return ((rows as unknown as { permission: { name: string } }[]) || [])
    .map((r) => r.permission.name)
    .sort()
}

describe("Matriz de permissões — Gerente e Vendedor (Etapa 3)", () => {
  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("Gerente tem o operacional completo, mas não configurações/auditoria/usuários/aprovação financeira", async () => {
    const perms = await permissionsOf("Gerente")

    const mustHave = [
      "dashboard.view",
      "products.view", "products.create", "products.edit", "products.delete",
      "categories.view", "categories.create", "categories.edit", "categories.delete",
      "brands.view", "brands.create", "brands.edit", "brands.delete",
      "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.export", "suppliers.import",
      "customers.view", "customers.create", "customers.edit", "customers.export", "customers.import",
      "inventory.view", "inventory.create", "inventory.edit", "inventory.approve",
      "purchases.view", "purchases.create", "purchases.edit", "purchases.approve", "purchases.cancel",
      "sales.view", "sales.create", "sales.cancel", "sales.export",
      "cash.view", "cash.manage", "cash.create", "cash.approve",
      "financial.view", "financial.create", "financial.edit",
      "reports.view", "reports.export",
    ]
    for (const p of mustHave) {
      expect(perms, `Gerente deveria ter "${p}"`).toContain(p)
    }

    const mustNotHave = [
      "audit.view",
      "settings.view", "settings.edit",
      "users.view", "users.create", "users.edit", "users.delete",
      "roles.manage",
      "financial.approve",
    ]
    for (const p of mustNotHave) {
      expect(perms, `Gerente NÃO deveria ter "${p}"`).not.toContain(p)
    }
  })

  it("Vendedor tem só o necessário pro balcão — nunca sangria/suprimento ou fechar caixa", async () => {
    const perms = await permissionsOf("Vendedor")

    const mustHave = [
      "dashboard.view",
      "products.view",
      "customers.view", "customers.create", "customers.edit",
      "inventory.view",
      "sales.create", "sales.view",
      "cash.manage", "cash.view",
    ]
    for (const p of mustHave) {
      expect(perms, `Vendedor deveria ter "${p}"`).toContain(p)
    }

    const mustNotHave = [
      "cash.approve", // fechar/aprovar caixa é ação de supervisor
      "cash.create", // sangria/suprimento fica com o Gerente
      "sales.cancel", // cancelamento exige autorização
      "products.create", "products.edit", "products.delete",
      "purchases.view", "purchases.create",
      "financial.view", "financial.approve",
      "reports.view",
      "audit.view",
      "settings.view", "settings.edit",
      "users.create", "users.edit",
      "roles.manage",
    ]
    for (const p of mustNotHave) {
      expect(perms, `Vendedor NÃO deveria ter "${p}"`).not.toContain(p)
    }
  })
})
