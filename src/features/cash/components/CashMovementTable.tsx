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
import { formatCurrency, formatRelativeTime } from "@/utils/format"
import { CashMovement, CashMovementType } from "@/types"
import { History } from "lucide-react"

const INCREASE_TYPES: CashMovementType[] = ["Entrada", "Suprimento"]

function typeVariant(type: CashMovementType): "success" | "destructive" {
  return INCREASE_TYPES.includes(type) ? "success" : "destructive"
}

export function CashMovementTable({ movements }: { movements: CashMovement[] }) {
  if (movements.length === 0) {
    return (
      <EmptyState icon={History} title="Nenhuma movimentação" description="Ainda não há movimentos neste caixa." />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tipo</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Quando</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <Badge variant={typeVariant(m.movement_type)}>{m.movement_type}</Badge>
            </TableCell>
            <TableCell className={INCREASE_TYPES.includes(m.movement_type) ? "text-success" : "text-destructive"}>
              {INCREASE_TYPES.includes(m.movement_type) ? "+" : "−"} {formatCurrency(m.value)}
            </TableCell>
            <TableCell className="text-muted-foreground">{m.description || "-"}</TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">{formatRelativeTime(m.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
