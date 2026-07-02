"use client"

import React from "react"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Wine, DollarSign, ShoppingCart, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    { title: "Vendas do Dia", value: "R$ 1.840,00", desc: "+12% em relação a ontem", icon: DollarSign, trend: "up", trendValue: "+12%" },
    { title: "Pedidos Concluídos", value: "32", desc: "Ticket médio de R$ 57,50", icon: ShoppingCart, trend: "up", trendValue: "+8%" },
    { title: "Novos Clientes", value: "5", desc: "Total de 142 cadastrados", icon: TrendingUp, trend: "up", trendValue: "+25%" },
    { title: "Produtos em Falta", value: "3", desc: "Necessitam de compra urgente", icon: AlertCircle, trend: "down", trendValue: "3 itens" },
  ]

  const recentSales = [
    { id: "V001", client: "João Silva", total: "R$ 120,00", status: "Pago", time: "há 10 min" },
    { id: "V002", client: "Maria Souza", total: "R$ 85,50", status: "Pago", time: "há 25 min" },
    { id: "V003", client: "Carlos Oliveira", total: "R$ 310,00", status: "Pendente", time: "há 1h" },
    { id: "V004", client: "Ana Santos", total: "R$ 45,00", status: "Pago", time: "há 2h" },
  ]

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
            Empresa: {user?.company?.name || "Adega Modelo"}
          </Badge>
          <Badge variant="success" className="text-xs py-1 px-2.5">
            Caixa: Aberto
          </Badge>
        </div>
      </div>

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
                  {stat.trend === "up" ? (
                    <span className="text-success flex items-center">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                      {stat.trendValue}
                    </span>
                  ) : (
                    <span className="text-destructive flex items-center">
                      <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                      {stat.trendValue}
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
            <CardDescription>Lista dos últimos pedidos realizados hoje.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {sale.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{sale.client}</p>
                      <p className="text-xs text-muted-foreground">{sale.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">{sale.total}</span>
                    <Badge variant={sale.status === "Pago" ? "success" : "warning"}>
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="bg-card/30 border-border/40">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acessos rápidos do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-muted/40 transition-all text-left">
              <div className="flex items-center gap-3">
                <Wine className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Novo Produto</p>
                  <p className="text-xs text-muted-foreground">Cadastrar bebida</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border/40 hover:border-primary/40 bg-muted/10 hover:bg-muted/40 transition-all text-left">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Realizar Venda (PDV)</p>
                  <p className="text-xs text-muted-foreground">Acessar caixa rápido</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
