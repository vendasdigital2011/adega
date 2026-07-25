"use client"

import React, { useState } from "react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { SearchInput } from "@/components/ui/SearchInput"
import { Select } from "@/components/ui/Select"
import { Pagination } from "@/components/ui/Pagination"
import { Loading } from "@/components/ui/Loading"
import { ShortcutsHelpModal } from "@/components/ui/ShortcutsHelpModal"
import { MovementTable } from "@/features/inventory/components/MovementTable"
import { MovementForm } from "@/features/inventory/components/MovementForm"
import { useMovements, useLowStock, useRegisterMovement } from "@/features/inventory/hooks/useInventory"
import { MovementFormInputs, MOVEMENT_TYPES } from "@/features/inventory/schemas/movement.schema"
import { useDebounce } from "@/hooks/useDebounce"
import { usePagination } from "@/hooks/usePagination"
import { usePermission } from "@/hooks/usePermission"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { getErrorMessage } from "@/lib/utils"
import { MovementType } from "@/types"
import { Plus, AlertTriangle } from "lucide-react"

const INVENTORY_SHORTCUTS = [
  { keys: "F1", description: "Abrir esta lista de atalhos" },
  { keys: "F2", description: "Nova movimentação" },
  { keys: "F5", description: "Atualizar dados da tela" },
  { keys: "Esc", description: "Fechar modal" },
]

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [typeFilter, setTypeFilter] = useState<"all" | MovementType>("all")
  const pagination = usePagination({ initialLimit: 10 })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const { data, isLoading } = useMovements({
    search: debouncedSearch,
    movementType: typeFilter === "all" ? undefined : typeFilter,
    page: pagination.page,
    limit: pagination.limit,
  })
  const { data: lowStock } = useLowStock()
  const registerMovement = useRegisterMovement()

  const canCreate = usePermission("inventory.create")

  // Atalhos de página (Etapa 6): F2 abre a modal, F5 força refresh
  useKeyboardShortcuts([
    { key: "F2", handler: () => setIsFormOpen(true), enabled: canCreate },
    { key: "F1", handler: () => setIsHelpOpen(true) },
    { key: "F5", handler: () => window.location.reload(), allowInTyping: true },
  ])

  React.useEffect(() => {
    if (data) pagination.setTotal(data.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleRegister = async (formData: MovementFormInputs) => {
    try {
      await registerMovement.mutateAsync({
        product_id: formData.product_id,
        movement_type: formData.movement_type,
        quantity: formData.quantity,
        reference: formData.reference || null,
        observation: formData.observation || null,
      })
      toast.success("Movimentação registrada com sucesso!")
      setIsFormOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível registrar a movimentação."))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">Movimentações e histórico de estoque.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
        )}
      </div>

      {lowStock && lowStock.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="h-4 w-4" />
            {lowStock.length} produto(s) no estoque mínimo ou abaixo
          </div>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            {lowStock.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.name} — saldo <span className="text-destructive font-medium">{p.current_stock}</span> (mín {p.minimum_stock})
              </li>
            ))}
            {lowStock.length > 5 && <li>e mais {lowStock.length - 5}...</li>}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          placeholder="Pesquisar por produto ou SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as "all" | MovementType)
            pagination.setPage(1)
          }}
          options={[{ value: "all", label: "Todos os tipos" }, ...MOVEMENT_TYPES.map((t) => ({ value: t, label: t }))]}
          className="max-w-[200px]"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <MovementTable movements={data?.data || []} />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        </>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nova Movimentação" size="lg">
        <MovementForm
          onSubmit={handleRegister}
          onCancel={() => setIsFormOpen(false)}
          isLoading={registerMovement.isPending}
        />
      </Modal>

      <ShortcutsHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} shortcuts={INVENTORY_SHORTCUTS} />
    </div>
  )
}
