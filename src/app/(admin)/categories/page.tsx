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
import { CategoryTable } from "@/features/categories/components/CategoryTable"
import { CategoryForm } from "@/features/categories/components/CategoryForm"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useSetCategoryActive,
} from "@/features/categories/hooks/useCategories"
import { CategoryFormInputs } from "@/features/categories/schemas/category.schema"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { Category } from "@/types"
import { Plus } from "lucide-react"

type StatusFilter = "all" | "active" | "inactive"

export default function CategoriesPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)
  const [toggleTarget, setToggleTarget] = useState<{ category: Category; active: boolean } | null>(null)

  const { data, isLoading } = useCategories({
    search: debouncedSearch,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
    page: pagination.page,
    limit: pagination.limit,
  })

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const setActive = useSetCategoryActive()

  const canCreate = usePermission("categories.create")
  const canEdit = usePermission("categories.edit")
  const canToggle = usePermission("categories.delete")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreateOrEdit = async (formData: CategoryFormInputs) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          input: { name: formData.name, description: formData.description || null },
        })
        toast.success("Categoria atualizada com sucesso!")
      } else {
        await createCategory.mutateAsync({
          name: formData.name,
          description: formData.description || null,
        })
        toast.success("Categoria criada com sucesso!")
      }
      setIsFormOpen(false)
      setEditingCategory(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar a categoria."))
    }
  }

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return
    try {
      await setActive.mutateAsync({ id: toggleTarget.category.id, active: toggleTarget.active })
      toast.success(toggleTarget.active ? "Categoria reativada!" : "Categoria inativada!")
      setToggleTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a situação."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de produtos da sua empresa.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingCategory(undefined)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Pesquisar por nome ou descrição..."
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
          <CategoryTable
            categories={data?.data || []}
            onEdit={(category) => {
              setEditingCategory(category)
              setIsFormOpen(true)
            }}
            onToggleActive={(category, active) => setToggleTarget({ category, active })}
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
          setEditingCategory(undefined)
        }}
        title={editingCategory ? "Editar Categoria" : "Nova Categoria"}
      >
        <CategoryForm
          category={editingCategory}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingCategory(undefined)
          }}
          isLoading={createCategory.isPending || updateCategory.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.active ? "Reativar categoria" : "Inativar categoria"}
        description={
          toggleTarget?.active
            ? `Deseja reativar a categoria "${toggleTarget?.category.name}"?`
            : `Deseja inativar a categoria "${toggleTarget?.category.name}"? Ela não poderá ser usada em novos produtos.`
        }
        variant={toggleTarget?.active ? "success" : "danger"}
        isLoading={setActive.isPending}
      />
    </div>
  )
}
