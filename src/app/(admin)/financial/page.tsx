"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Card, CardContent } from "@/components/ui/Card"
import { Select } from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { Loading } from "@/components/ui/Loading"
import { Pagination } from "@/components/ui/Pagination"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { cn } from "@/lib/utils"
import { ReceivableForm } from "@/features/financial/components/ReceivableForm"
import { PayableForm } from "@/features/financial/components/PayableForm"
import { SettleForm } from "@/features/financial/components/SettleForm"
import { CostCenterForm } from "@/features/financial/components/CostCenterForm"
import { ReceivableTable } from "@/features/financial/components/ReceivableTable"
import { PayableTable } from "@/features/financial/components/PayableTable"
import { CostCenterTable } from "@/features/financial/components/CostCenterTable"
import { CashFlowTable } from "@/features/financial/components/CashFlowTable"
import {
  useReceivables,
  usePayables,
  useCostCenters,
  useCashFlow,
  useCreateReceivable,
  useCreatePayable,
  useRegisterReceipt,
  useRegisterPayment,
  useCancelReceivable,
  useCancelPayable,
  useCreateCostCenter,
  useSetCostCenterActive,
} from "@/features/financial/hooks/useFinancial"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { getErrorMessage } from "@/lib/utils"
import { AccountReceivable, AccountPayable, AccountsReceivableStatus, AccountsPayableStatus } from "@/types"

type Tab = "receivable" | "payable" | "cashflow" | "costcenters"

const TABS: { key: Tab; label: string }[] = [
  { key: "receivable", label: "Contas a Receber" },
  { key: "payable", label: "Contas a Pagar" },
  { key: "cashflow", label: "Fluxo de Caixa" },
  { key: "costcenters", label: "Centros de Custo" },
]

function firstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function FinancialPage() {
  const [tab, setTab] = useState<Tab>("receivable")

  const canView = usePermission("financial.view")
  const canCreate = usePermission("financial.create")
  const canApprove = usePermission("financial.approve")
  const canEdit = usePermission("financial.edit")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">Contas a receber, contas a pagar, fluxo de caixa e centros de custo.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/40">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!canView ? (
        <Card className="bg-card/30 border-border/40">
          <CardContent className="py-8 text-center text-muted-foreground">
            Você não tem permissão para ver o módulo financeiro.
          </CardContent>
        </Card>
      ) : (
        <>
          {tab === "receivable" && <ReceivableTab canCreate={canCreate} canApprove={canApprove} canEdit={canEdit} />}
          {tab === "payable" && <PayableTab canCreate={canCreate} canApprove={canApprove} canEdit={canEdit} />}
          {tab === "cashflow" && <CashFlowTab />}
          {tab === "costcenters" && <CostCentersTab canCreate={canCreate} canEdit={canEdit} />}
        </>
      )}
    </div>
  )
}

// ============================================================
// Contas a Receber
// ============================================================
function ReceivableTab({ canCreate, canApprove, canEdit }: { canCreate: boolean; canApprove: boolean; canEdit: boolean }) {
  const [statusFilter, setStatusFilter] = useState<AccountsReceivableStatus | "">("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [settling, setSettling] = useState<AccountReceivable | null>(null)
  const [cancelling, setCancelling] = useState<AccountReceivable | null>(null)

  const pagination = usePagination({ initialLimit: 10 })
  const { data, isLoading } = useReceivables({
    status: statusFilter || undefined,
    page: pagination.page,
    limit: pagination.limit,
  })

  const createReceivable = useCreateReceivable()
  const registerReceipt = useRegisterReceipt()
  const cancelReceivable = useCancelReceivable()

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const statusOptions = [
    { value: "", label: "Todas as situações" },
    { value: "Aberta", label: "Aberta" },
    { value: "Parcial", label: "Parcial" },
    { value: "Recebida", label: "Recebida" },
    { value: "Cancelada", label: "Cancelada" },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-56">
            <Select
              label="Situação"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountsReceivableStatus | "")}
            />
          </div>
          {canCreate && <Button onClick={() => setIsCreateOpen(true)}>Novo lançamento</Button>}
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <ReceivableTable
              receivables={data?.data || []}
              onSettle={setSettling}
              onCancel={setCancelling}
              canApprove={canApprove}
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
      </CardContent>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Conta a Receber">
        <ReceivableForm
          isLoading={createReceivable.isPending}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={async (formData) => {
            try {
              await createReceivable.mutateAsync({
                customer_id: formData.customer_id || null,
                cost_center_id: formData.cost_center_id || null,
                description: formData.description || null,
                due_date: formData.due_date,
                amount: formData.amount,
              })
              toast.success("Conta a receber criada!")
              setIsCreateOpen(false)
            } catch (error) {
              toast.error(getErrorMessage(error, "Não foi possível criar a conta a receber."))
            }
          }}
        />
      </Modal>

      <Modal isOpen={!!settling} onClose={() => setSettling(null)} title="Registrar Recebimento">
        {settling && (
          <SettleForm
            outstanding={settling.amount - settling.received_amount}
            submitLabel="Registrar"
            isLoading={registerReceipt.isPending}
            onCancel={() => setSettling(null)}
            onSubmit={async (formData) => {
              try {
                await registerReceipt.mutateAsync({
                  id: settling.id,
                  value: formData.value,
                  description: formData.description || null,
                })
                toast.success("Recebimento registrado!")
                setSettling(null)
              } catch (error) {
                toast.error(getErrorMessage(error, "Não foi possível registrar o recebimento."))
              }
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancelar conta a receber"
        description="Esta conta será marcada como cancelada e não poderá mais receber pagamentos."
        isLoading={cancelReceivable.isPending}
        onConfirm={async () => {
          if (!cancelling) return
          try {
            await cancelReceivable.mutateAsync(cancelling.id)
            toast.success("Conta cancelada.")
          } catch (error) {
            toast.error(getErrorMessage(error, "Não foi possível cancelar a conta."))
          }
        }}
      />
    </Card>
  )
}

// ============================================================
// Contas a Pagar
// ============================================================
function PayableTab({ canCreate, canApprove, canEdit }: { canCreate: boolean; canApprove: boolean; canEdit: boolean }) {
  const [statusFilter, setStatusFilter] = useState<AccountsPayableStatus | "">("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [settling, setSettling] = useState<AccountPayable | null>(null)
  const [cancelling, setCancelling] = useState<AccountPayable | null>(null)

  const pagination = usePagination({ initialLimit: 10 })
  const { data, isLoading } = usePayables({
    status: statusFilter || undefined,
    page: pagination.page,
    limit: pagination.limit,
  })

  const createPayable = useCreatePayable()
  const registerPayment = useRegisterPayment()
  const cancelPayable = useCancelPayable()

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const statusOptions = [
    { value: "", label: "Todas as situações" },
    { value: "Aberta", label: "Aberta" },
    { value: "Parcial", label: "Parcial" },
    { value: "Paga", label: "Paga" },
    { value: "Cancelada", label: "Cancelada" },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-56">
            <Select
              label="Situação"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AccountsPayableStatus | "")}
            />
          </div>
          {canCreate && <Button onClick={() => setIsCreateOpen(true)}>Novo lançamento</Button>}
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <PayableTable
              payables={data?.data || []}
              onSettle={setSettling}
              onCancel={setCancelling}
              canApprove={canApprove}
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
      </CardContent>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nova Conta a Pagar">
        <PayableForm
          isLoading={createPayable.isPending}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={async (formData) => {
            try {
              await createPayable.mutateAsync({
                supplier_id: formData.supplier_id || null,
                cost_center_id: formData.cost_center_id || null,
                description: formData.description || null,
                due_date: formData.due_date,
                amount: formData.amount,
              })
              toast.success("Conta a pagar criada!")
              setIsCreateOpen(false)
            } catch (error) {
              toast.error(getErrorMessage(error, "Não foi possível criar a conta a pagar."))
            }
          }}
        />
      </Modal>

      <Modal isOpen={!!settling} onClose={() => setSettling(null)} title="Registrar Pagamento">
        {settling && (
          <SettleForm
            outstanding={settling.amount - settling.paid_amount}
            submitLabel="Registrar"
            isLoading={registerPayment.isPending}
            onCancel={() => setSettling(null)}
            onSubmit={async (formData) => {
              try {
                await registerPayment.mutateAsync({
                  id: settling.id,
                  value: formData.value,
                  description: formData.description || null,
                })
                toast.success("Pagamento registrado!")
                setSettling(null)
              } catch (error) {
                toast.error(getErrorMessage(error, "Não foi possível registrar o pagamento."))
              }
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelling}
        onClose={() => setCancelling(null)}
        title="Cancelar conta a pagar"
        description="Esta conta será marcada como cancelada e não poderá mais receber pagamentos."
        isLoading={cancelPayable.isPending}
        onConfirm={async () => {
          if (!cancelling) return
          try {
            await cancelPayable.mutateAsync(cancelling.id)
            toast.success("Conta cancelada.")
          } catch (error) {
            toast.error(getErrorMessage(error, "Não foi possível cancelar a conta."))
          }
        }}
      />
    </Card>
  )
}

// ============================================================
// Fluxo de Caixa
// ============================================================
function CashFlowTab() {
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const { data, isLoading } = useCashFlow(startDate, endDate)

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {isLoading ? <Loading /> : <CashFlowTable entries={data || []} />}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Centros de Custo
// ============================================================
function CostCentersTab({ canCreate, canEdit }: { canCreate: boolean; canEdit: boolean }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const pagination = usePagination({ initialLimit: 10 })
  const { data, isLoading } = useCostCenters({ page: pagination.page, limit: pagination.limit })

  const createCostCenter = useCreateCostCenter()
  const setActive = useSetCostCenterActive()

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-end">
          {canCreate && <Button onClick={() => setIsCreateOpen(true)}>Novo centro de custo</Button>}
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <CostCenterTable
              costCenters={data?.data || []}
              canToggle={canEdit}
              onToggleActive={async (cc, active) => {
                try {
                  await setActive.mutateAsync({ id: cc.id, active })
                  toast.success(active ? "Centro de custo reativado." : "Centro de custo inativado.")
                } catch (error) {
                  toast.error(getErrorMessage(error, "Não foi possível atualizar."))
                }
              }}
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
      </CardContent>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Novo Centro de Custo">
        <CostCenterForm
          isLoading={createCostCenter.isPending}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={async (formData) => {
            try {
              await createCostCenter.mutateAsync({ name: formData.name })
              toast.success("Centro de custo criado!")
              setIsCreateOpen(false)
            } catch (error) {
              toast.error(getErrorMessage(error, "Não foi possível criar o centro de custo."))
            }
          }}
        />
      </Modal>
    </Card>
  )
}
