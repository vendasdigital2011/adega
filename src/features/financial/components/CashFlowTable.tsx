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
import { CashFlowEntry } from "@/services/FinancialService"
import { LineChart } from "lucide-react"

export function CashFlowTable({ entries }: { entries: CashFlowEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState icon={LineChart} title="Nenhuma movimentação no período" description="Ajuste o período selecionado." />
    )
  }

  const totalIn = entries.filter((e) => e.direction === "Entrada").reduce((s, e) => s + e.value, 0)
  const totalOut = entries.filter((e) => e.direction === "Saída").reduce((s, e) => s + e.value, 0)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Entradas</p>
          <p className="text-lg font-semibold text-success">{formatCurrency(totalIn)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Saídas</p>
          <p className="text-lg font-semibold text-destructive">{formatCurrency(totalOut)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Saldo do período</p>
          <p className="text-lg font-semibold">{formatCurrency(totalIn - totalOut)}</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</TableCell>
              <TableCell>
                <Badge variant={e.direction === "Entrada" ? "success" : "destructive"}>{e.type}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{e.description || "-"}</TableCell>
              <TableCell className={`text-right ${e.direction === "Entrada" ? "text-success" : "text-destructive"}`}>
                {e.direction === "Entrada" ? "+" : "−"} {formatCurrency(e.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
