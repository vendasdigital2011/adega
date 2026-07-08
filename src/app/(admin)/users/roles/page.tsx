"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Card, CardContent } from "@/components/ui/Card"
import { Loading } from "@/components/ui/Loading"
import { RoleForm } from "@/features/users/components/RoleForm"
import { PermissionMatrix } from "@/features/users/components/PermissionMatrix"
import { useRoles, useCreateRole, useUpdateRole } from "@/features/users/hooks/useRoles"
import { getErrorMessage, cn } from "@/lib/utils"
import { Role } from "@/types"
import { Plus, Pencil } from "lucide-react"

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined)

  const handleSubmit = async (data: { name: string; description?: string }) => {
    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, input: data })
        toast.success("Perfil atualizado com sucesso!")
      } else {
        await createRole.mutateAsync(data)
        toast.success("Perfil criado com sucesso!")
      }
      setIsFormOpen(false)
      setEditingRole(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o perfil."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfis e Permissões</h1>
          <p className="text-muted-foreground">
            Gerencie os perfis de acesso e a matriz de permissões por módulo.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRole(undefined)
            setIsFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-3 space-y-1">
            {isLoading ? (
              <Loading />
            ) : (
              (roles || []).map((role) => (
                <div
                  key={role.id}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2.5 cursor-pointer transition-colors",
                    selectedRoleId === role.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <div>
                    <p className="text-sm font-medium">{role.name}</p>
                    {role.description && (
                      <p
                        className={cn(
                          "text-xs",
                          selectedRoleId === role.id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {role.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingRole(role)
                      setIsFormOpen(true)
                    }}
                    className="shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <PermissionMatrix roleId={selectedRoleId} />
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingRole(undefined)
        }}
        title={editingRole ? "Editar Perfil" : "Novo Perfil"}
      >
        <RoleForm
          role={editingRole}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingRole(undefined)
          }}
          isLoading={createRole.isPending || updateRole.isPending}
        />
      </Modal>
    </div>
  )
}
