"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatDate } from "@/utils/format"
import { InventoryMovement, MovementType } from "@/types"
import { History } from "lucide-react"

interface MovementTableProps {
  movements: InventoryMovement[]
}

const INCREASE_TYPES: MovementType[] = ["Entrada", "Compra"]
const DECREASE_TYPES: MovementType[] = ["Saída", "Venda", "Perda", "Quebra"]

function typeVariant(type: MovementType): "success" | "destructive" | "secondary" {
  if (INCREASE_TYPES.includes(type)) return "success"
  if (DECREASE_TYPES.includes(type)) return "destructive"
  return "secondary" // Ajuste, Inventário
}

export function MovementTable({ movements }: MovementTableProps) {
  if (movements.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Nenhuma movimentação encontrada"
        description="Registre uma movimentação ou ajuste os filtros."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Qtd.</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Referência</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(m.created_at)}</TableCell>
            <TableCell className="font-medium">
              {m.product?.name || "-"}
              {m.product?.sku && <span className="block text-xs text-muted-foreground">{m.product.sku}</span>}
            </TableCell>
            <TableCell>
              <Badge variant={typeVariant(m.movement_type)}>{m.movement_type}</Badge>
            </TableCell>
            <TableCell>{m.quantity}</TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {m.previous_quantity} → <span className="font-medium text-foreground">{m.current_quantity}</span>
            </TableCell>
            <TableCell className="text-muted-foreground">{m.reference || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
