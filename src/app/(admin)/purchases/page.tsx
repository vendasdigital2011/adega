"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Select } from "@/components/ui/Select"
import { Pagination } from "@/components/ui/Pagination"
import { Loading } from "@/components/ui/Loading"
import { PurchaseTable } from "@/features/purchases/components/PurchaseTable"
import { PurchaseForm } from "@/features/purchases/components/PurchaseForm"
import {
  usePurchases,
  usePurchaseItems,
  useCreatePurchase,
  useReceivePurchase,
  useCancelPurchase,
} from "@/features/purchases/hooks/usePurchases"
import { PurchaseFormInputs } from "@/features/purchases/schemas/purchase.schema"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"
import { Purchase, PurchaseStatus } from "@/types"
import { Plus } from "lucide-react"

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseStatus>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewing, setViewing] = useState<Purchase | null>(null)
  const [receiveTarget, setReceiveTarget] = useState<Purchase | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Purchase | null>(null)

  const { data, isLoading } = usePurchases({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: pagination.page,
    limit: pagination.limit,
  })
  const { data: viewingItems } = usePurchaseItems(viewing?.id ?? null)

  const createPurchase = useCreatePurchase()
  const receivePurchase = useReceivePurchase()
  const cancelPurchase = useCancelPurchase()

  const canCreate = usePermission("purchases.create")
  const canReceive = usePermission("purchases.approve")
  const canCancel = usePermission("purchases.cancel")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreate = async (formData: PurchaseFormInputs) => {
    try {
      await createPurchase.mutateAsync({
        supplier_id: formData.supplier_id,
        purchase_date: formData.purchase_date,
        freight: formData.freight ?? 0,
        discount: formData.discount ?? 0,
        notes: formData.notes || null,
        items: formData.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      })
      toast.success("Compra criada com sucesso!")
      setIsFormOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível criar a compra."))
    }
  }

  const handleReceive = async () => {
    if (!receiveTarget) return
    try {
      await receivePurchase.mutateAsync(receiveTarget.id)
      toast.success("Compra recebida! Estoque atualizado.")
      setReceiveTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível receber a compra."))
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelPurchase.mutateAsync(cancelTarget.id)
      toast.success("Compra cancelada.")
      setCancelTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível cancelar a compra."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">Pedidos de compra e entrada de estoque.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Compra
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "all" | PurchaseStatus)
            pagination.setPage(1)
          }}
          options={[
            { value: "all", label: "Todas as situações" },
            { value: "pendente", label: "Pendentes" },
            { value: "recebida", label: "Recebidas" },
            { value: "cancelada", label: "Canceladas" },
          ]}
          className="max-w-[220px]"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <PurchaseTable
            purchases={data?.data || []}
            onView={(p) => setViewing(p)}
            onReceive={(p) => setReceiveTarget(p)}
            onCancel={(p) => setCancelTarget(p)}
            canReceive={canReceive}
            canCancel={canCancel}
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

      {/* Nova compra */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nova Compra" size="xl">
        <PurchaseForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
          isLoading={createPurchase.isPending}
        />
      </Modal>

      {/* Ver itens */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Itens da compra" size="lg">
        <div className="space-y-2">
          {(viewingItems || []).map((it) => (
            <div key={it.id} className="flex justify-between text-sm border-b border-border/30 pb-2">
              <span>
                {it.product?.name || "-"}{" "}
                <span className="text-muted-foreground">x{it.quantity}</span>
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(it.unit_price)} = <span className="text-foreground font-medium">{formatCurrency(it.total)}</span>
              </span>
            </div>
          ))}
          {viewing && (
            <div className="flex justify-between pt-2 text-sm">
              <span className="text-muted-foreground">Frete {formatCurrency(viewing.freight)} · Desconto {formatCurrency(viewing.discount)}</span>
              <span className="font-bold">Total {formatCurrency(viewing.total)}</span>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!receiveTarget}
        onClose={() => setReceiveTarget(null)}
        onConfirm={handleReceive}
        title="Receber compra"
        description="Ao receber, o estoque dos produtos será acrescido e o custo será atualizado. Confirmar?"
        variant="success"
        isLoading={receivePurchase.isPending}
      />

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancelar compra"
        description={
          cancelTarget?.status === "recebida"
            ? "Esta compra já foi recebida. Ao cancelar, o estoque adicionado será estornado. Confirmar?"
            : "Deseja cancelar esta compra pendente?"
        }
        variant="danger"
        isLoading={cancelPurchase.isPending}
      />
    </div>
  )
}
