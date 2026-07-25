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
import { CustomerTable } from "@/features/customers/components/CustomerTable"
import { CustomerForm } from "@/features/customers/components/CustomerForm"
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useSetCustomerActive,
} from "@/features/customers/hooks/useCustomers"
import { CustomerFormInputs } from "@/features/customers/schemas/customer.schema"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { Customer } from "@/types"
import { Plus } from "lucide-react"

type StatusFilter = "all" | "active" | "inactive"

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined)
  const [toggleTarget, setToggleTarget] = useState<{ customer: Customer; active: boolean } | null>(null)

  const { data, isLoading } = useCustomers({
    search: debouncedSearch,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
    page: pagination.page,
    limit: pagination.limit,
  })

  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const setActive = useSetCustomerActive()

  const canCreate = usePermission("customers.create")
  const canEdit = usePermission("customers.edit")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreateOrEdit = async (formData: CustomerFormInputs) => {
    try {
      const payload = {
        name: formData.name,
        document: formData.document || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        birthday: formData.birthday || null,
        city: formData.city || null,
        state: formData.state || null,
        address: formData.address || null,
        notes: formData.notes || null,
        credit_limit: formData.credit_limit ?? null,
      }
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, input: payload })
        toast.success("Cliente atualizado com sucesso!")
      } else {
        await createCustomer.mutateAsync(payload)
        toast.success("Cliente criado com sucesso!")
      }
      setIsFormOpen(false)
      setEditingCustomer(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o cliente."))
    }
  }

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return
    try {
      await setActive.mutateAsync({ id: toggleTarget.customer.id, active: toggleTarget.active })
      toast.success(toggleTarget.active ? "Cliente reativado!" : "Cliente inativado!")
      setToggleTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a situação."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes da sua empresa.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingCustomer(undefined)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
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
          <CustomerTable
            customers={data?.data || []}
            onEdit={(customer) => {
              setEditingCustomer(customer)
              setIsFormOpen(true)
            }}
            onToggleActive={(customer, active) => setToggleTarget({ customer, active })}
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
          setEditingCustomer(undefined)
        }}
        title={editingCustomer ? "Editar Cliente" : "Novo Cliente"}
        size="lg"
      >
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingCustomer(undefined)
          }}
          isLoading={createCustomer.isPending || updateCustomer.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.active ? "Reativar cliente" : "Inativar cliente"}
        description={
          toggleTarget?.active
            ? `Deseja reativar o cliente "${toggleTarget?.customer.name}"?`
            : `Deseja inativar o cliente "${toggleTarget?.customer.name}"?`
        }
        variant={toggleTarget?.active ? "success" : "danger"}
        isLoading={setActive.isPending}
      />
    </div>
  )
}
