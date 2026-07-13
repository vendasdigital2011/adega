"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { PurchaseStatusBadge } from "./PurchaseStatusBadge"
import { formatCurrency, formatDate } from "@/utils/format"
import { Purchase } from "@/types"
import { ShoppingCart, Eye, PackageCheck, Ban } from "lucide-react"

interface PurchaseTableProps {
  purchases: Purchase[]
  onView: (purchase: Purchase) => void
  onReceive: (purchase: Purchase) => void
  onCancel: (purchase: Purchase) => void
  canReceive?: boolean
  canCancel?: boolean
}

export function PurchaseTable({
  purchases,
  onView,
  onReceive,
  onCancel,
  canReceive = true,
  canCancel = true,
}: PurchaseTableProps) {
  if (purchases.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nenhuma compra encontrada"
        description="Registre uma nova compra ou ajuste os filtros."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((purchase) => (
          <TableRow key={purchase.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(purchase.purchase_date)}</TableCell>
            <TableCell className="font-medium">{purchase.supplier?.name || "-"}</TableCell>
            <TableCell>{formatCurrency(purchase.total)}</TableCell>
            <TableCell>
              <PurchaseStatusBadge status={purchase.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onView(purchase)} title="Ver itens">
                  <Eye className="h-4 w-4" />
                </Button>
                {canReceive && purchase.status === "pendente" && (
                  <Button variant="ghost" size="icon" onClick={() => onReceive(purchase)} title="Receber">
                    <PackageCheck className="h-4 w-4 text-success" />
                  </Button>
                )}
                {canCancel && purchase.status !== "cancelada" && (
                  <Button variant="ghost" size="icon" onClick={() => onCancel(purchase)} title="Cancelar">
                    <Ban className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
