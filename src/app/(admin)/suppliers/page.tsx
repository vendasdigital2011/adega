"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { SearchInput } from "@/components/ui/SearchInput"
import { Select } from "@/components/ui/Select"
import { Pagination } from "@/components/ui/Pagination"
import { Loading } from "@/components/ui/Loading"
import { SupplierTable } from "@/features/suppliers/components/SupplierTable"
import { SupplierForm } from "@/features/suppliers/components/SupplierForm"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useSetSupplierActive,
} from "@/features/suppliers/hooks/useSuppliers"
import { SupplierFormInputs } from "@/features/suppliers/schemas/supplier.schema"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { Supplier } from "@/types"
import { Plus } from "lucide-react"

type StatusFilter = "all" | "active" | "inactive"

export default function SuppliersPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined)
  const [toggleTarget, setToggleTarget] = useState<{ supplier: Supplier; active: boolean } | null>(null)

  const { data, isLoading } = useSuppliers({
    search: debouncedSearch,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
    page: pagination.page,
    limit: pagination.limit,
  })

  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const setActive = useSetSupplierActive()

  const canCreate = usePermission("suppliers.create")
  const canEdit = usePermission("suppliers.edit")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreateOrEdit = async (formData: SupplierFormInputs) => {
    try {
      const payload = {
        name: formData.name,
        document: formData.document,
        phone: formData.phone,
        email: formData.email || null,
        city: formData.city || null,
        state: formData.state || null,
        address: formData.address || null,
        notes: formData.notes || null,
      }
      if (editingSupplier) {
        await updateSupplier.mutateAsync({ id: editingSupplier.id, input: payload })
        toast.success("Fornecedor atualizado com sucesso!")
      } else {
        await createSupplier.mutateAsync(payload)
        toast.success("Fornecedor criado com sucesso!")
      }
      setIsFormOpen(false)
      setEditingSupplier(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o fornecedor."))
    }
  }

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return
    try {
      await setActive.mutateAsync({ id: toggleTarget.supplier.id, active: toggleTarget.active })
      toast.success(toggleTarget.active ? "Fornecedor reativado!" : "Fornecedor inativado!")
      setToggleTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a situação."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie os fornecedores da sua empresa.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingSupplier(undefined)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Pesquisar por nome, documento ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter)
            pagination.setPage(1)
          }}
          options={[
            { value: "all", label: "Todas as situações" },
            { value: "active", label: "Somente ativos" },
            { value: "inactive", label: "Somente inativos" },
          ]}
          className="max-w-[220px]"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <SupplierTable
            suppliers={data?.data || []}
            onEdit={(supplier) => {
              setEditingSupplier(supplier)
              setIsFormOpen(true)
            }}
            onToggleActive={(supplier, active) => setToggleTarget({ supplier, active })}
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
          setEditingSupplier(undefined)
        }}
        title={editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
        size="lg"
      >
        <SupplierForm
          supplier={editingSupplier}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingSupplier(undefined)
          }}
          isLoading={createSupplier.isPending || updateSupplier.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.active ? "Reativar fornecedor" : "Inativar fornecedor"}
        description={
          toggleTarget?.active
            ? `Deseja reativar o fornecedor "${toggleTarget?.supplier.name}"?`
            : `Deseja inativar o fornecedor "${toggleTarget?.supplier.name}"? Ele não poderá ser usado em novas compras.`
        }
        variant={toggleTarget?.active ? "success" : "danger"}
        isLoading={setActive.isPending}
      />
    </div>
  )
}
