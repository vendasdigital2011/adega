"use client"

import React from "react"
import { Skeleton } from "@/components/ui/Skeleton"
import { useAllPermissions, useRolePermissions, useTogglePermission } from "../hooks/usePermissions"
import { Permission } from "@/types"

interface PermissionMatrixProps {
  roleId: string | null
}

const MODULE_LABELS: Record<string, string> = {
  cash: "Caixa",
  categories: "Categorias",
  customers: "Clientes",
  dashboard: "Painel",
  financial: "Financeiro",
  inventory: "Estoque",
  products: "Produtos",
  purchases: "Compras",
  reports: "Relatórios",
  roles: "Perfis e Permissões",
  sales: "Vendas",
  settings: "Configurações",
  suppliers: "Fornecedores",
  users: "Usuários",
}

function moduleLabel(module: string) {
  return MODULE_LABELS[module] ?? module
}

function groupByModule(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>()
  for (const permission of permissions) {
    const [module] = permission.name.split(".")
    if (!groups.has(module)) groups.set(module, [])
    groups.get(module)!.push(permission)
  }
  return groups
}

export function PermissionMatrix({ roleId }: PermissionMatrixProps) {
  const { data: allPermissions, isLoading: loadingPermissions } = useAllPermissions()
  const { data: grantedIds, isLoading: loadingRolePermissions } = useRolePermissions(roleId)
  const toggle = useTogglePermission(roleId)

  if (!roleId) {
    return <p className="text-sm text-muted-foreground">Selecione um perfil para ver suas permissões.</p>
  }

  if (loadingPermissions || loadingRolePermissions) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  const grantedSet = new Set(grantedIds || [])
  const groups = groupByModule(allPermissions || [])

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([module, permissions]) => (
        <div key={module}>
          <h4 className="text-sm font-semibold text-foreground mb-2">{moduleLabel(module)}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {permissions.map((permission) => {
              const isGranted = grantedSet.has(permission.id)
              return (
                <label
                  key={permission.id}
                  className="flex items-center gap-2 text-sm rounded-md border border-border/60 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isGranted}
                    disabled={toggle.isPending}
                    onChange={(e) => toggle.mutate({ permissionId: permission.id, grant: e.target.checked })}
                    className="accent-primary"
                  />
                  <span title={permission.name}>{permission.description || permission.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
