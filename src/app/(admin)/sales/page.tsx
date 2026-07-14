"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Select } from "@/components/ui/Select"
import { Pagination } from "@/components/ui/Pagination"
import { Loading } from "@/components/ui/Loading"
import { SaleTable } from "@/features/sales/components/SaleTable"
import { SaleForm } from "@/features/sales/components/SaleForm"
import { useSales, useSaleItems, useCreateSale, useCancelSale } from "@/features/sales/hooks/useSales"
import { SaleFormInputs } from "@/features/sales/schemas/sale.schema"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"
import { Sale, SaleStatus } from "@/types"
import { Plus } from "lucide-react"

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | SaleStatus>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewing, setViewing] = useState<Sale | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null)

  const { data, isLoading } = useSales({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: pagination.page,
    limit: pagination.limit,
  })
  const { data: viewingItems } = useSaleItems(viewing?.id ?? null)

  const createSale = useCreateSale()
  const cancelSale = useCancelSale()

  const canCreate = usePermission("sales.create")
  const canCancel = usePermission("sales.cancel")

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleCreate = async (formData: SaleFormInputs) => {
    try {
      await createSale.mutateAsync({
        customer_id: formData.customer_id || null,
        sale_date: formData.sale_date,
        discount: formData.discount ?? 0,
        payment_method: formData.payment_method,
        items: formData.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      })
      toast.success("Venda finalizada! Estoque atualizado.")
      setIsFormOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível finalizar a venda."))
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelSale.mutateAsync(cancelTarget.id)
      toast.success("Venda cancelada. Estoque estornado.")
      setCancelTarget(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível cancelar a venda."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Registre vendas e acompanhe o histórico.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "all" | SaleStatus)
            pagination.setPage(1)
          }}
          options={[
            { value: "all", label: "Todas as situações" },
            { value: "finalizada", label: "Finalizadas" },
            { value: "cancelada", label: "Canceladas" },
          ]}
          className="max-w-[220px]"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <SaleTable
            sales={data?.data || []}
            onView={(s) => setViewing(s)}
            onCancel={(s) => setCancelTarget(s)}
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

      {/* Nova venda */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nova Venda" size="xl">
        <SaleForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} isLoading={createSale.isPending} />
      </Modal>

      {/* Ver itens */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Itens da venda" size="lg">
        <div className="space-y-2">
          {(viewingItems || []).map((it) => (
            <div key={it.id} className="flex justify-between text-sm border-b border-border/30 pb-2">
              <span>
                {it.product?.name || "-"} <span className="text-muted-foreground">x{it.quantity}</span>
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(it.unit_price)} = <span className="text-foreground font-medium">{formatCurrency(it.total)}</span>
              </span>
            </div>
          ))}
          {viewing && (
            <div className="flex justify-between pt-2 text-sm">
              <span className="text-muted-foreground">
                Subtotal {formatCurrency(viewing.subtotal)} · Desconto {formatCurrency(viewing.discount)} · {viewing.payment_method}
              </span>
              <span className="font-bold">Total {formatCurrency(viewing.total)}</span>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancelar venda"
        description="Ao cancelar, os produtos vendidos retornarão ao estoque. A venda permanecerá registrada como cancelada. Confirmar?"
        variant="danger"
        isLoading={cancelSale.isPending}
      />
    </div>
  )
}
