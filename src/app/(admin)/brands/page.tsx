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
import { BrandTable } from "@/features/brands/components/BrandTable"
import { BrandForm } from "@/features/brands/components/BrandForm"
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useSetBrandActive,
} from "@/features/brands/hooks/useBrands"
import { BrandFormInputs } from "@/features/brands/schemas/brand.schema"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { Brand } from "@/types"
import { Plus } from "lucide-react"

type StatusFilter = "all" | "active" | "inactive"

export default function BrandsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | undefined>(undefined)
  const [toggleTarget, setToggleTarget] = useState<{ brand: Brand; active: boolean } | null>(null)

  const { data, isLoading } = useBrands({
    search: debouncedSearch,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
    page: pagination.page,
    limit: pagination.limit,
  })

  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const setActive = useSetBrandActive()

  const canCreate = usePermission("brands.create")
  const canEdit = usePermission("brands.edit")
  const canToggle = usePermission("brands.delete")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreateOrEdit = async (formData: BrandFormInputs) => {
    try {
      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand.id, input: { name: formData.name } })
        toast.success("Marca atualizada com sucesso!")
      } else {
        await createBrand.mutateAsync({ name: formData.name })
        toast.success("Marca criada com sucesso!")
      }
      setIsFormOpen(false)
      setEditingBrand(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar a marca."))
    }
  }

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return
    try {
      await setActive.mutateAsync({ id: toggleTarget.brand.id, active: toggleTarget.active })
      toast.success(toggleTarget.active ? "Marca reativada!" : "Marca inativada!")
      setToggleTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a situação."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
          <p className="text-muted-foreground">Gerencie as marcas de produtos da sua empresa.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingBrand(undefined)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Marca
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Pesquisar por nome..."
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
            { value: "active", label: "Somente ativas" },
            { value: "inactive", label: "Somente inativas" },
          ]}
          className="max-w-[220px]"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <BrandTable
            brands={data?.data || []}
            onEdit={(brand) => {
              setEditingBrand(brand)
              setIsFormOpen(true)
            }}
            onToggleActive={(brand, active) => setToggleTarget({ brand, active })}
            canEdit={canEdit}
            canToggle={canToggle}
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
          setEditingBrand(undefined)
        }}
        title={editingBrand ? "Editar Marca" : "Nova Marca"}
      >
        <BrandForm
          brand={editingBrand}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingBrand(undefined)
          }}
          isLoading={createBrand.isPending || updateBrand.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.active ? "Reativar marca" : "Inativar marca"}
        description={
          toggleTarget?.active
            ? `Deseja reativar a marca "${toggleTarget?.brand.name}"?`
            : `Deseja inativar a marca "${toggleTarget?.brand.name}"? Ela não poderá ser usada em novos produtos.`
        }
        variant={toggleTarget?.active ? "success" : "danger"}
        isLoading={setActive.isPending}
      />
    </div>
  )
}
