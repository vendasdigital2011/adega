"use client"

import React, { useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { SearchInput } from "@/components/ui/SearchInput"
import { Pagination } from "@/components/ui/Pagination"
import { Loading } from "@/components/ui/Loading"
import { UserTable } from "@/features/users/components/UserTable"
import { UserForm } from "@/features/users/components/UserForm"
import { useUsers, useCreateUser, useUpdateUser } from "@/features/users/hooks/useUsers"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { User, UserStatus } from "@/types"
import { UserCog, Plus } from "lucide-react"

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)
  const [statusChange, setStatusChange] = useState<{ user: User; status: UserStatus } | null>(null)

  const { data, isLoading } = useUsers({
    search: debouncedSearch,
    page: pagination.page,
    limit: pagination.limit,
  })

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const canCreate = usePermission("users.create")
  const canEdit = usePermission("users.edit")
  const canManageRoles = usePermission("roles.manage")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreateOrEdit = async (formData: { name: string; phone?: string; role_id: string; email?: string; password?: string }) => {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({
          id: editingUser.id,
          input: { name: formData.name, phone: formData.phone, role_id: formData.role_id },
        })
        toast.success("Usuário atualizado com sucesso!")
      } else {
        await createUser.mutateAsync({
          name: formData.name,
          email: formData.email!,
          password: formData.password!,
          phone: formData.phone,
          role_id: formData.role_id,
        })
        toast.success("Usuário criado com sucesso!")
      }
      setIsFormOpen(false)
      setEditingUser(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o usuário."))
    }
  }

  const handleConfirmStatusChange = async () => {
    if (!statusChange) return
    try {
      await updateUser.mutateAsync({ id: statusChange.user.id, input: { status: statusChange.status } })
      toast.success("Status atualizado com sucesso!")
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o status."))
    }
  }

  const statusDialog = (() => {
    if (!statusChange) return { title: "", description: "", variant: "danger" as const }
    const name = statusChange.user.name
    switch (statusChange.status) {
      case "active":
        return statusChange.user.status === "blocked"
          ? { title: "Desbloquear usuário", description: `Deseja desbloquear o acesso de ${name}?`, variant: "success" as const }
          : { title: "Reativar usuário", description: `Deseja reativar o acesso de ${name}?`, variant: "success" as const }
      case "blocked":
        return {
          title: "Bloquear usuário",
          description: `Deseja bloquear o acesso de ${name}? Ele não conseguirá mais fazer login até ser desbloqueado.`,
          variant: "danger" as const,
        }
      case "inactive":
      default:
        return {
          title: "Inativar usuário",
          description: `Deseja inativar o acesso de ${name}? Ele não conseguirá mais fazer login.`,
          variant: "danger" as const,
        }
    }
  })()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários da sua empresa.</p>
        </div>
        <div className="flex items-center gap-2">
          {canManageRoles && (
            <Link href="/users/roles">
              <Button variant="outline">
                <UserCog className="h-4 w-4 mr-2" />
                Perfis e Permissões
              </Button>
            </Link>
          )}
          {canCreate && (
            <Button
              onClick={() => {
                setEditingUser(undefined)
                setIsFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          )}
        </div>
      </div>

      <SearchInput
        placeholder="Pesquisar por nome ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <UserTable
            users={data?.data || []}
            onEdit={(user) => {
              setEditingUser(user)
              setIsFormOpen(true)
            }}
            onChangeStatus={(user, status) => setStatusChange({ user, status })}
            canEdit={canEdit}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        </>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingUser(undefined)
        }}
        title={editingUser ? "Editar Usuário" : "Novo Usuário"}
      >
        <UserForm
          user={editingUser}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingUser(undefined)
          }}
          isLoading={createUser.isPending || updateUser.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!statusChange}
        onClose={() => setStatusChange(null)}
        onConfirm={handleConfirmStatusChange}
        title={statusDialog.title}
        description={statusDialog.description}
        variant={statusDialog.variant}
        isLoading={updateUser.isPending}
      />
    </div>
  )
}
