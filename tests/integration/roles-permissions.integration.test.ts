import { describe, it, expect, beforeAll } from "vitest"
import { roleService } from "@/services/RoleService"
import { permissionService } from "@/services/PermissionService"
import { loginAppClientAs } from "./helpers/appAuth"

describe("RoleService / PermissionService (integração)", () => {
  beforeAll(async () => {
    await loginAppClientAs("admin")
  })

  it("lista os perfis da própria empresa", async () => {
    const roles = await roleService.list()
    expect(roles.some((r) => r.name === "Administrador")).toBe(true)
    expect(roles.some((r) => r.name === "Vendedor")).toBe(true)
  })

  it("cria e atualiza um novo perfil", async () => {
    const created = await roleService.create({ name: `Perfil Teste Vitest ${Date.now()}`, description: "criado por teste" })
    expect(created.id).toBeTruthy()
    const updated = await roleService.update(created.id, { description: "atualizado por teste" })
    expect(updated.description).toBe("atualizado por teste")
  })

  it("listAll retorna o catálogo completo de permissões", async () => {
    const permissions = await permissionService.listAll()
    expect(permissions.some((p) => p.name === "audit.view")).toBe(true)
    expect(permissions.length).toBeGreaterThan(20)
  })

  it("grant/revoke altera role_permissions da role de teste", async () => {
    const role = await roleService.create({ name: `Perfil Permissao Vitest ${Date.now()}` })
    const permissions = await permissionService.listAll()
    const target = permissions.find((p) => p.name === "categories.view")!

    await permissionService.grant(role.id, target.id)
    let assigned = await permissionService.listForRole(role.id)
    expect(assigned).toContain(target.id)

    await permissionService.revoke(role.id, target.id)
    assigned = await permissionService.listForRole(role.id)
    expect(assigned).not.toContain(target.id)
  })
})
