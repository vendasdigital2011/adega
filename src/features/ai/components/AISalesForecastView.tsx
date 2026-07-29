"use client"

import React from "react"
import { useAIDashboard } from "@/hooks/useAI"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { TrendingUp, Calendar, DollarSign, BarChart3 } from "lucide-react"

export function AISalesForecastView() {
  const { data: summary, isLoading } = useAIDashboard()

  if (isLoading || !summary) {
    return <div className="p-8 text-center text-slate-500">Carregando previsão de vendas...</div>
  }

  const { sales_forecast } = summary

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-purple-700 dark:text-purple-300">Previsão Diária</span>
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
          <h4 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            R$ {sales_forecast.daily_forecast.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h4>
          <p className="mt-1 text-xs text-slate-500">Estimativa para o próximo dia útil</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-indigo-200 dark:border-indigo-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-300">Previsão Semanal</span>
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <h4 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            R$ {sales_forecast.weekly_forecast.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h4>
          <p className="mt-1 text-xs text-slate-500">Acumulado projetado para 7 dias</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/40 dark:to-slate-900 border-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Previsão Mensal</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <h4 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            R$ {sales_forecast.monthly_forecast.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h4>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <span>+{sales_forecast.percentage_change}% vs mês anterior</span>
          </div>
        </Card>
      </div>

      {/* Projeção detalhada dia a dia */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Projeção Diária de Vendas (Histórico e Tendência Preditiva)
          </h3>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
            Intervalo de Confiança 95%
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Histórico Real</TableHead>
              <TableHead>Venda Projetada (IA)</TableHead>
              <TableHead>Cenário Otimista</TableHead>
              <TableHead>Cenário Conservador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales_forecast.forecast_items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(item.date + "T00:00:00").toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  {item.historical_sales !== undefined
                    ? `R$ ${item.historical_sales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "-"}
                </TableCell>
                <TableCell className="font-bold text-purple-600 dark:text-purple-400">
                  R$ {item.projected_sales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-emerald-600 text-xs font-medium">
                  R$ {item.confidence_upper.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-amber-600 text-xs font-medium">
                  R$ {item.confidence_lower.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
