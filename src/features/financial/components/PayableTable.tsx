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
import { AccountPayable } from "@/types"
import { displayStatus } from "../utils"
import { Receipt, CheckCircle2, Ban } from "lucide-react"

interface PayableTableProps {
  payables: AccountPayable[]
  onSettle: (payable: AccountPayable) => void
  onCancel: (payable: AccountPayable) => void
  canApprove?: boolean
  canEdit?: boolean
}

export function PayableTable({ payables, onSettle, onCancel, canApprove, canEdit }: PayableTableProps) {
  if (payables.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma conta a pagar"
        description="Lançamentos de compras recebidas e despesas manuais aparecerão aqui."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vencimento</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Pago</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payables.map((p) => {
          const status = displayStatus(p.status, p.due_date, "Paga")
          const open = p.status === "Aberta" || p.status === "Parcial"
          return (
            <TableRow key={p.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(p.due_date)}</TableCell>
              <TableCell>{p.description || "-"}</TableCell>
              <TableCell className="font-medium">{p.supplier?.name || "Despesa avulsa"}</TableCell>
              <TableCell>{formatCurrency(p.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{formatCurrency(p.paid_amount)}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {open && canApprove && (
                    <Button variant="ghost" size="icon" onClick={() => onSettle(p)} title="Registrar pagamento">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  {open && canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onCancel(p)} title="Cancelar conta">
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
