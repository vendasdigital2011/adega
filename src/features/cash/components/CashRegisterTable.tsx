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
import { formatCurrency, formatDate } from "@/utils/format"
import { CashRegister } from "@/types"
import { Wallet } from "lucide-react"

export function CashRegisterTable({ registers }: { registers: CashRegister[] }) {
  if (registers.length === 0) {
    return (
      <EmptyState icon={Wallet} title="Nenhum caixa registrado" description="O histórico de aberturas aparecerá aqui." />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Aberto por</TableHead>
          <TableHead>Abertura</TableHead>
          <TableHead>Valor inicial</TableHead>
          <TableHead>Fechamento</TableHead>
          <TableHead>Valor final</TableHead>
          <TableHead>Diferença</TableHead>
          <TableHead>Situação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registers.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.opened_by_user?.name || "-"}</TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(r.opened_at)}</TableCell>
            <TableCell>{formatCurrency(r.initial_value)}</TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {r.closed_at ? formatDate(r.closed_at) : "-"}
            </TableCell>
            <TableCell>{r.final_value !== null ? formatCurrency(r.final_value) : "-"}</TableCell>
            <TableCell>
              {r.difference === null ? (
                "-"
              ) : (
                <span className={r.difference === 0 ? "" : r.difference > 0 ? "text-success" : "text-destructive"}>
                  {r.difference > 0 ? "+" : ""}
                  {formatCurrency(r.difference)}
                </span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={r.status === "aberto" ? "success" : "secondary"}>
                {r.status === "aberto" ? "Aberto" : "Fechado"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
