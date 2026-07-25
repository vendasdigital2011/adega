"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Loading } from "@/components/ui/Loading"
import { Pagination } from "@/components/ui/Pagination"
import { ShortcutsHelpModal } from "@/components/ui/ShortcutsHelpModal"
import { OpenCashForm } from "@/features/cash/components/OpenCashForm"
import { CloseCashForm } from "@/features/cash/components/CloseCashForm"
import { CashMovementForm } from "@/features/cash/components/CashMovementForm"
import { CashMovementTable } from "@/features/cash/components/CashMovementTable"
import { CashRegisterTable } from "@/features/cash/components/CashRegisterTable"
import {
  useOpenRegister,
  useRegisterMovements,
  useRegisters,
  useOpenCash,
  useCloseCash,
  useRegisterCashMovement,
} from "@/features/cash/hooks/useCash"
import { OpenCashFormInputs, CloseCashFormInputs, MovementFormInputs } from "@/features/cash/schemas/cash.schema"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { getErrorMessage } from "@/lib/utils"
import { formatCurrency, formatDate } from "@/utils/format"
import { CashMovementType } from "@/types"
import { Plus, Minus, Lock, Unlock } from "lucide-react"

const CASH_SHORTCUTS = [
  { keys: "F1", description: "Abrir esta lista de atalhos" },
  { keys: "F2", description: "Abrir caixa (se fechado) ou Sangria/Suprimento (se aberto)" },
  { keys: "F5", description: "Atualizar dados da tela" },
  { keys: "Ctrl + Shift + E", description: "Registrar suprimento (se caixa aberto)" },
  { keys: "Esc", description: "Fechar modal" },
]

function calcBalance(initial: number, movements: { movement_type: CashMovementType; value: number }[]): number {
  return movements.reduce((bal, m) => {
    const isIncrease = m.movement_type === "Entrada" || m.movement_type === "Suprimento"
    return isIncrease ? bal + m.value : bal - m.value
  }, initial)
}

export default function CashPage() {
  const [isOpenFormOpen, setIsOpenFormOpen] = useState(false)
  const [isCloseFormOpen, setIsCloseFormOpen] = useState(false)
  const [isMovementFormOpen, setIsMovementFormOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const historyPagination = usePagination({ initialLimit: 10 })

  const { data: openRegister, isLoading: loadingOpen } = useOpenRegister()
  const { data: movements, isLoading: loadingMovements } = useRegisterMovements(openRegister?.id ?? null)
  const { data: history, isLoading: loadingHistory } = useRegisters({
    page: historyPagination.page,
    limit: historyPagination.limit,
  })

  const openCash = useOpenCash()
  const closeCash = useCloseCash()
  const registerMovement = useRegisterCashMovement()

  const canManage = usePermission("cash.manage")
  const canApprove = usePermission("cash.approve")
  const canCreate = usePermission("cash.create")

  // Atalhos de página (Etapa 6): F2=Abrir/Suprimento, F5=Refresh, Ctrl+Shift+E=Suprimento
  useKeyboardShortcuts([
    {
      key: "F2",
      handler: () => {
        if (openRegister) {
          setIsMovementFormOpen(true)
        } else {
          setIsOpenFormOpen(true)
        }
      },
      enabled: openRegister ? canCreate : canManage,
    },
    { key: "F1", handler: () => setIsHelpOpen(true) },
    { key: "F5", handler: () => window.location.reload(), allowInTyping: true },
    {
      key: "E",
      shift: true,
      ctrl: true,
      handler: () => openRegister && canCreate && setIsMovementFormOpen(true),
      enabled: openRegister && canCreate,
    },
  ])

  React.useEffect(() => {
    if (history) historyPagination.setTotal(history.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history])

  const balance = openRegister ? calcBalance(openRegister.initial_value, movements || []) : 0

  const handleOpen = async (formData: OpenCashFormInputs) => {
    try {
      await openCash.mutateAsync(formData.initial_value)
      toast.success("Caixa aberto com sucesso!")
      setIsOpenFormOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível abrir o caixa."))
    }
  }

  const handleClose = async (formData: CloseCashFormInputs) => {
    if (!openRegister) return
    try {
      const closed = await closeCash.mutateAsync({ id: openRegister.id, finalValue: formData.final_value })
      const diff = closed.difference ?? 0
      if (diff === 0) {
        toast.success("Caixa fechado sem diferenças!")
      } else {
        toast(
          `Caixa fechado com diferença de ${diff > 0 ? "+" : ""}${formatCurrency(diff)}`,
          { icon: diff > 0 ? "🔼" : "🔽" }
        )
      }
      setIsCloseFormOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível fechar o caixa."))
    }
  }

  const handleMovement = async (formData: MovementFormInputs) => {
    if (!openRegister) return
    try {
      await registerMovement.mutateAsync({
        cashRegisterId: openRegister.id,
        movementType: formData.movement_type,
        value: formData.value,
        description: formData.description || null,
      })
      toast.success(`${formData.movement_type} registrada!`)
      setIsMovementFormOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível registrar a movimentação."))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Caixa</h1>
        <p className="text-muted-foreground">Abertura, fechamento, sangria e suprimento.</p>
      </div>

      {loadingOpen ? (
        <Loading />
      ) : (
        <Card className="bg-card/30 border-border/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {openRegister ? (
                  <>
                    <Unlock className="h-5 w-5 text-success" />
                    Caixa Aberto
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    Caixa Fechado
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {openRegister
                  ? `Aberto em ${formatDate(openRegister.opened_at)}`
                  : "Abra o caixa para poder realizar vendas."}
              </CardDescription>
            </div>
            {openRegister ? (
              <Badge variant="success">Aberto</Badge>
            ) : (
              <Badge variant="secondary">Fechado</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {openRegister ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Valor inicial</p>
                    <p className="text-lg font-semibold">{formatCurrency(openRegister.initial_value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo esperado agora</p>
                    <p className="text-lg font-semibold">{formatCurrency(balance)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canCreate && (
                    <Button variant="outline" size="sm" onClick={() => setIsMovementFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      <Minus className="h-4 w-4 mr-1" />
                      Sangria / Suprimento
                    </Button>
                  )}
                  {canApprove && (
                    <Button variant="danger" size="sm" onClick={() => setIsCloseFormOpen(true)}>
                      <Lock className="h-4 w-4 mr-1" />
                      Fechar Caixa
                    </Button>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground/80 mb-2">Movimentações desta sessão</h3>
                  {loadingMovements ? <Loading /> : <CashMovementTable movements={movements || []} />}
                </div>
              </>
            ) : (
              canManage && (
                <Button onClick={() => setIsOpenFormOpen(true)}>
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/30 border-border/40">
        <CardHeader>
          <CardTitle>Histórico de Caixas</CardTitle>
          <CardDescription>Sessões anteriores de abertura e fechamento.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <Loading />
          ) : (
            <>
              <CashRegisterTable registers={history?.data || []} />
              <div className="mt-4">
                <Pagination
                  page={historyPagination.page}
                  totalPages={historyPagination.totalPages}
                  onPageChange={historyPagination.setPage}
                  hasNextPage={historyPagination.hasNextPage}
                  hasPrevPage={historyPagination.hasPrevPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isOpenFormOpen} onClose={() => setIsOpenFormOpen(false)} title="Abrir Caixa">
        <OpenCashForm onSubmit={handleOpen} onCancel={() => setIsOpenFormOpen(false)} isLoading={openCash.isPending} />
      </Modal>

      <Modal isOpen={isCloseFormOpen} onClose={() => setIsCloseFormOpen(false)} title="Fechar Caixa">
        <CloseCashForm
          expectedBalance={balance}
          onSubmit={handleClose}
          onCancel={() => setIsCloseFormOpen(false)}
          isLoading={closeCash.isPending}
        />
      </Modal>

      <Modal isOpen={isMovementFormOpen} onClose={() => setIsMovementFormOpen(false)} title="Sangria / Suprimento">
        <CashMovementForm
          onSubmit={handleMovement}
          onCancel={() => setIsMovementFormOpen(false)}
          isLoading={registerMovement.isPending}
        />
      </Modal>

      <ShortcutsHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} shortcuts={CASH_SHORTCUTS} />
    </div>
  )
}
