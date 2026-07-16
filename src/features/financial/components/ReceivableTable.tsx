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
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatCurrency, formatDate } from "@/utils/format"
import { AccountReceivable } from "@/types"
import { displayStatus } from "../utils"
import { CircleDollarSign, CheckCircle2, Ban } from "lucide-react"

interface ReceivableTableProps {
  receivables: AccountReceivable[]
  onSettle: (receivable: AccountReceivable) => void
  onCancel: (receivable: AccountReceivable) => void
  canApprove?: boolean
  canEdit?: boolean
}

export function ReceivableTable({ receivables, onSettle, onCancel, canApprove, canEdit }: ReceivableTableProps) {
  if (receivables.length === 0) {
    return (
      <EmptyState
        icon={CircleDollarSign}
        title="Nenhuma conta a receber"
        description="Lançamentos de vendas fiado e receitas manuais aparecerão aqui."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vencimento</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Recebido</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {receivables.map((r) => {
          const status = displayStatus(r.status, r.due_date, "Recebida")
          const open = r.status === "Aberta" || r.status === "Parcial"
          return (
            <TableRow key={r.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(r.due_date)}</TableCell>
              <TableCell>{r.description || "-"}</TableCell>
              <TableCell className="font-medium">{r.customer?.name || "Receita avulsa"}</TableCell>
              <TableCell>{formatCurrency(r.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{formatCurrency(r.received_amount)}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {open && canApprove && (
                    <Button variant="ghost" size="icon" onClick={() => onSettle(r)} title="Registrar recebimento">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  {open && canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onCancel(r)} title="Cancelar conta">
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
