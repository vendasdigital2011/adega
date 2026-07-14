"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Loading } from "@/components/ui/Loading"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatCurrency, formatRelativeTime } from "@/utils/format"
import {
  Wine,
  DollarSign,
  ShoppingCart,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
} from "lucide-react"

type Trend = { direction: "up" | "down" | "flat"; label: string }

function calcTrend(current: number, previous: number): Trend {
  if (previous <= 0) {
    if (current <= 0) return { direction: "flat", label: "Sem vendas ontem" }
    return { direction: "up", label: "Sem comparativo (zero ontem)" }
  }
  const change = Math.round(((current - previous) / previous) * 100)
  if (change === 0) return { direction: "flat", label: "Estável em relação a ontem" }
  return {
    direction: change > 0 ? "up" : "down",
    label: `${change > 0 ? "+" : ""}${change}% em relação a ontem`,
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useDashboardSummary()

  const salesTrend = data ? calcTrend(data.todayTotal, data.yesterdayTotal) : null
  const ordersTrend = data ? calcTrend(data.todayOrders, data.yesterdayOrders) : null
  const customersTrend = data ? calcTrend(data.newCustomersToday, data.newCustomersYesterday) : null
  const avgTicket = data && data.todayOrders > 0 ? data.todayTotal / data.todayOrders : 0

  const stats = data
    ? [
        {
          title: "Vendas do Dia",
          value: formatCurrency(data.todayTotal),
          desc: salesTrend!.label,
          icon: DollarSign,
          trend: salesTrend!.direction,
        },
        {
          title: "Pedidos Concluídos",
          value: String(data.todayOrders),
          desc: `Ticket médio de ${formatCurrency(avgTicket)}`,
          icon: ShoppingCart,
          trend: ordersTrend!.direction,
        },
        {
          title: "Novos Clientes",
          value: String(data.newCustomersToday),
          desc: `Total de ${data.totalCustomers} cadastrados`,
          icon: Users,
          trend: customersTrend!.direction,
        },
        {
          title: "Produtos em Falta",
          value: String(data.lowStockCount),
          desc: data.lowStockCount > 0 ? "Necessitam de compra urgente" : "Estoque sob controle",
          icon: AlertCircle,
          trend: null,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, <span className="font-semibold text-foreground">{user?.name}</span>! Aqui está o resumo da sua adega hoje.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-muted/30 py-1 px-2.5">
            Empresa: {user?.company?.name || "-"}
          </Badge>
        </div>
      </div>

      {isLoading || !data ? (
        <Loading />
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <Card key={i} className="bg-card/30 border-border/40 hover:border-border transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      {stat.trend === "up" && (
                        <span className="text-success flex items-center">
                          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                        </span>
                      )}
                      {stat.trend === "down" && (
                        <span className="text-destructive flex items-center">
                          <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                        </span>
                      )}
                      <span>{stat.desc}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Layout Content: Main Area & Side Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sales Activity */}
            <Card className="col-span-1 lg:col-span-2 bg-card/30 border-border/40">
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
                <CardDescription>Últimos pedidos registrados.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentSales.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="Nenhuma venda registrada"
                    description="As vendas realizadas vão aparecer aqui."
                  />
                ) : (
                  <div className="divide-y divide-border/40">
                    {data.recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Receipt className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{sale.customerName || "Balcão"}</p>
                            <p className="text-xs text-muted-foreground">{formatRelativeTime(sale.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">{formatCurrency(sale.total)}</span>
                          <Badge variant={sale.status === "finalizada" ? "success" : "destructive"}>
                            {sale.status === "finalizada" ? "Finalizada" : "Cancelada"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Panel */}
            <Card className="bg-card/30 border-border/40">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acessos rápidos do sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/products"
                  className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-muted/40 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Wine className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Novo Produto</p>
                      <p className="text-xs text-muted-foreground">Cadastrar bebida</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  href="/sales"
                  className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-muted/40 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Realizar Venda (PDV)</p>
                      <p className="text-xs text-muted-foreground">Registrar uma nova venda</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
