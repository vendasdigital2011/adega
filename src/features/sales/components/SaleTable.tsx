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
import { Sale } from "@/types"
import { DollarSign, Eye, Ban } from "lucide-react"

interface SaleTableProps {
  sales: Sale[]
  onView: (sale: Sale) => void
  onCancel: (sale: Sale) => void
  canCancel?: boolean
}

export function SaleTable({ sales, onView, onCancel, canCancel = true }: SaleTableProps) {
  if (sales.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Nenhuma venda encontrada"
        description="Registre uma nova venda ou ajuste os filtros."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(sale.sale_date)}</TableCell>
            <TableCell className="font-medium">{sale.customer?.name || "Balcão"}</TableCell>
            <TableCell className="text-muted-foreground">{sale.payment_method}</TableCell>
            <TableCell>{formatCurrency(sale.total)}</TableCell>
            <TableCell>
              <Badge variant={sale.status === "finalizada" ? "success" : "destructive"}>
                {sale.status === "finalizada" ? "Finalizada" : "Cancelada"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onView(sale)} title="Ver itens">
                  <Eye className="h-4 w-4" />
                </Button>
                {canCancel && sale.status === "finalizada" && (
                  <Button variant="ghost" size="icon" onClick={() => onCancel(sale)} title="Cancelar venda">
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
