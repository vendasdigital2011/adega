"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Shield } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card"
import { Select } from "@/components/ui/Select"
import { Loading } from "@/components/ui/Loading"
import { useRoles } from "@/features/users/hooks/useRoles"
import { useAllPermissions, useRolePermissions, useTogglePermission } from "@/features/users/hooks/usePermissions"
import { Permission, Role } from "@/types"

const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Produtos" },
  { key: "categories", label: "Categorias" },
  { key: "inventory", label: "Estoque" },
  { key: "purchases", label: "Compras" },
  { key: "sales", label: "Vendas" },
  { key: "customers", label: "Clientes" },
  { key: "suppliers", label: "Fornecedores" },
  { key: "financial", label: "Financeiro" },
  { key: "cash", label: "Caixa" },
  { key: "reports", label: "Relatórios" },
  { key: "settings", label: "Configurações" },
  { key: "users", label: "Usuários" },
  { key: "ai", label: "Inteligência Artificial" },
]

const ACTIONS = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
  { key: "import", label: "Importar" },
  { key: "export", label: "Exportar" },
  { key: "approve", label: "Aprovar" },
  { key: "cancel", label: "Cancelar" },
]

export function PermissionsManager() {
  const { data: roles, isLoading: loadingRoles } = useRoles()
  const { data: allPermissions, isLoading: loadingPerms } = useAllPermissions()

  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  // Define o primeiro cargo como selecionado assim que carregar
  React.useEffect(() => {
    if (roles && roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  const { data: grantedPermIds, isLoading: loadingGranted } = useRolePermissions(selectedRoleId || null)
  const toggleMutation = useTogglePermission(selectedRoleId || null)

  const isGranted = (permId: string) => {
    return grantedPermIds?.includes(permId) ?? false
  }

  const handleToggle = async (permId: string) => {
    if (!selectedRoleId) return
    const granted = isGranted(permId)
    try {
      await toggleMutation.mutateAsync({ permissionId: permId, grant: !granted })
      toast.success(granted ? "Permissão removida!" : "Permissão concedida!")
    } catch {
      toast.error("Não foi possível atualizar a permissão.")
    }
  }

  if (loadingRoles || loadingPerms) return <Loading />

  return (
    <Card className="bg-card/30 border-border/40">
      <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Shield className="h-5 w-5 text-primary" /> Controle de Permissões por Cargo
          </CardTitle>
          <CardDescription>
            Gerencie o que cada perfil pode acessar e executar no sistema.
          </CardDescription>
        </div>
        <div className="w-full md:w-64">
          <Select
            label="Perfil / Cargo"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            options={(roles || []).map((r: Role) => ({ value: r.id, label: r.name }))}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loadingGranted ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto border border-border/40 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="py-3 px-4">Módulo</th>
                  {ACTIONS.map((act) => (
                    <th key={act.key} className="py-3 px-2 text-center">
                      {act.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {MODULES.map((mod) => (
                  <tr key={mod.key} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{mod.label}</td>
                    {ACTIONS.map((act) => {
                      const perm = allPermissions?.find(
                        (p: Permission) => p.name === `${mod.key}.${act.key}` || p.id === `p_${mod.key}_${act.key}`
                      )
                      const permId = perm ? perm.id : `p_${mod.key}_${act.key}`
                      const checked = isGranted(permId)

                      return (
                        <td key={act.key} className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggle(permId)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
