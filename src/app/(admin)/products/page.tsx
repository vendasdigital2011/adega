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
import { ProductTable } from "@/features/products/components/ProductTable"
import { ProductForm } from "@/features/products/components/ProductForm"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useSetProductActive,
} from "@/features/products/hooks/useProducts"
import { ProductFormInputs } from "@/features/products/schemas/product.schema"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { Product } from "@/types"
import { Plus } from "lucide-react"

type StatusFilter = "all" | "active" | "inactive"

// Converte a saída do formulário (números já coeridos pelo zod) no payload do
// service, mapeando strings vazias de FK opcionais para null.
function toPayload(form: ProductFormInputs) {
  return {
    name: form.name,
    sku: form.sku,
    category_id: form.category_id,
    brand_id: form.brand_id || null,
    supplier_id: form.supplier_id || null,
    barcode: form.barcode || null,
    unit: form.unit || null,
    description: form.description || null,
    image_url: form.image_url || null,
    sale_price: form.sale_price,
    purchase_price: form.purchase_price ?? null,
    wholesale_price: form.wholesale_price ?? null,
    promotion_price: form.promotion_price ?? null,
    minimum_stock: form.minimum_stock,
  }
}

export default function ProductsPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [toggleTarget, setToggleTarget] = useState<{ product: Product; active: boolean } | null>(null)

  const { data, isLoading } = useProducts({
    search: debouncedSearch,
    active: statusFilter === "all" ? undefined : statusFilter === "active",
    page: pagination.page,
    limit: pagination.limit,
  })

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const setActive = useSetProductActive()

  const canCreate = usePermission("products.create")
  const canEdit = usePermission("products.edit")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreateOrEdit = async (formData: ProductFormInputs) => {
    try {
      const payload = toPayload(formData)
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, input: payload })
        toast.success("Produto atualizado com sucesso!")
      } else {
        await createProduct.mutateAsync(payload)
        toast.success("Produto criado com sucesso!")
      }
      setIsFormOpen(false)
      setEditingProduct(undefined)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível salvar o produto."))
    }
  }

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return
    try {
      await setActive.mutateAsync({ id: toggleTarget.product.id, active: toggleTarget.active })
      toast.success(toggleTarget.active ? "Produto reativado!" : "Produto inativado!")
      setToggleTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a situação."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie os produtos da sua empresa.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingProduct(undefined)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Pesquisar por nome, SKU ou código de barras..."
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
          <ProductTable
            products={data?.data || []}
            onEdit={(product) => {
              setEditingProduct(product)
              setIsFormOpen(true)
            }}
            onToggleActive={(product, active) => setToggleTarget({ product, active })}
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
          setEditingProduct(undefined)
        }}
        title={editingProduct ? "Editar Produto" : "Novo Produto"}
        size="xl"
      >
        <ProductForm
          product={editingProduct}
          onSubmit={handleCreateOrEdit}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingProduct(undefined)
          }}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.active ? "Reativar produto" : "Inativar produto"}
        description={
          toggleTarget?.active
            ? `Deseja reativar o produto "${toggleTarget?.product.name}"?`
            : `Deseja inativar o produto "${toggleTarget?.product.name}"? Ele não poderá ser usado em novas vendas.`
        }
        variant={toggleTarget?.active ? "success" : "danger"}
        isLoading={setActive.isPending}
      />
    </div>
  )
}
