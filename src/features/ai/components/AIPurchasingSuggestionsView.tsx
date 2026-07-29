"use client"

import React from "react"
import { useAIDashboard } from "@/hooks/useAI"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { EmptyState } from "@/components/ui/EmptyState"
import { ShoppingCart, AlertCircle, Check, Truck } from "lucide-react"

export function AIPurchasingSuggestionsView() {
  const { data: summary, isLoading } = useAIDashboard()

  if (isLoading || !summary) {
    return <div className="p-8 text-center text-slate-500">Carregando sugestões de compras...</div>
  }

  const { purchasing_suggestions } = summary

  if (purchasing_suggestions.length === 0) {
    return (
      <EmptyState
        title="Nenhum pedido de compra sugerido"
        description="Seu estoque de segurança está suficiente para o giro atual de vendas."
      />
    )
  }

  const totalEstimatedCost = purchasing_suggestions.reduce((acc, item) => acc + item.estimated_cost, 0)

  return (
    <div className="space-y-6">
      {/* Header card de resumo de compras */}
      <Card className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 dark:border-amber-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-amber-600" />
              Sugestão de Reposição Inteligente de Estoque
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Lista calculada considerando giro diário, estoque mínimo e risco de ruptura.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-semibold text-slate-500">Custo Total Estimado</span>
            <h4 className="text-2xl font-bold text-amber-600">
              R$ {totalEstimatedCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h4>
          </div>
        </div>
      </Card>

      {/* Tabela de Produtos Sugeridos */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Urgência</TableHead>
              <TableHead>Produto / SKU</TableHead>
              <TableHead>Estoque Atual</TableHead>
              <TableHead>Estoque Mínimo</TableHead>
              <TableHead>Giro Diário</TableHead>
              <TableHead>Qtd. Sugerida</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Custo Estimado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchasing_suggestions.map((item) => (
              <TableRow key={item.product_id}>
                <TableCell>
                  <Badge variant={item.urgency === "high" ? "destructive" : "warning"} className="uppercase text-[10px]">
                    {item.urgency === "high" ? "Urgente" : "Moderado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-900 dark:text-white">{item.product_name}</div>
                  <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                </TableCell>
                <TableCell className="font-bold text-amber-600">{item.current_stock}</TableCell>
                <TableCell>{item.min_stock}</TableCell>
                <TableCell className="text-slate-600">{item.average_daily_sales.toFixed(1)}/dia</TableCell>
                <TableCell className="font-bold text-purple-600 dark:text-purple-400">
                  +{item.recommended_quantity} un
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    {item.supplier_name || "N/A"}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-white">
                  R$ {item.estimated_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
