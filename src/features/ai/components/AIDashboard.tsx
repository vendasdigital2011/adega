"use client"

import React, { useState } from "react"
import { useAIDashboard, useUpdateAIInsight } from "@/hooks/useAI"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Loading } from "@/components/ui/Loading"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Brain,
  MessageSquare,
  ArrowRight,
} from "lucide-react"

interface AIDashboardProps {
  onOpenChat: (initialPrompt?: string) => void
}

export function AIDashboard({ onOpenChat }: AIDashboardProps) {
  const { data: summary, isLoading, error } = useAIDashboard()
  const updateInsight = useUpdateAIInsight()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <EmptyState
        title="Não foi possível carregar os dados da IA"
        description="Verifique a conexão ou adicione novos dados de vendas e estoque no sistema."
      />
    )
  }

  const { insights, sales_forecast, purchasing_suggestions, stock_summary, financial_summary, quick_prompts } = summary

  return (
    <div className="space-y-6">
      {/* Header Banner com Call to Action do Assistente */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              <h2 className="text-2xl font-bold tracking-tight">Assistente IA Adega Cloud</h2>
            </div>
            <p className="mt-1 text-sm text-purple-200">
              Análises preditivas, sugestões de compras e inteligência financeira gerencial em tempo real.
            </p>
          </div>
          <Button
            onClick={() => onOpenChat()}
            className="bg-yellow-500 text-slate-950 hover:bg-yellow-400 font-semibold shadow-lg transition-transform active:scale-95"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Abrir Chat IA
          </Button>
        </div>

        {/* Quick Prompts Chips */}
        <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2 pt-2 border-t border-purple-800/50">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Sugestões de Pergunta:</span>
          {quick_prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onOpenChat(prompt)}
              className="rounded-full bg-purple-800/60 px-3 py-1 text-xs text-purple-100 hover:bg-purple-700/80 hover:text-white transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de KPIs Preditivos da IA */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Previsão de Vendas (Mês)
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                R$ {sales_forecast.monthly_forecast.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>+{sales_forecast.percentage_change}%</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">tendência de crescimento</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sugestões de Compras
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {purchasing_suggestions.length} produto(s)
              </h3>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {purchasing_suggestions.filter((s) => s.urgency === "high").length} com urgência alta
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Valor Total em Estoque
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                R$ {stock_summary.total_stock_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {stock_summary.low_stock_products_count} no estoque mínimo
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Lucro Estimado no Mês
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                R$ {financial_summary.net_profit_this_month.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Margem líquida de {financial_summary.margin_percentage}%
          </div>
        </Card>
      </div>

      {/* Painéis Principais: Insights Ativos e Recomendações */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lista de Insights & Alertas Ativos */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas e Recomendações da IA</h3>
            </div>
            <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300">
              {insights.length} pendente(s)
            </Badge>
          </div>

          {insights.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Nenhum alerta crítico no momento. Seu sistema está operando perfeitamente.</p>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-md bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            insight.priority === "high"
                              ? "destructive"
                              : insight.priority === "medium"
                              ? "warning"
                              : "secondary"
                          }
                          className="uppercase text-[10px]"
                        >
                          {insight.priority}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          {insight.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-base">{insight.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{insight.description}</p>

                      {insight.action_suggestion && (
                        <div className="mt-2 rounded bg-purple-50 dark:bg-purple-950/40 p-2.5 text-xs text-purple-800 dark:text-purple-200 font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                          <span>{insight.action_suggestion}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateInsight.mutate({ id: insight.id, action: "accept" })}
                        disabled={updateInsight.isPending}
                        className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateInsight.mutate({ id: insight.id, action: "dismiss" })}
                        disabled={updateInsight.isPending}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Resumo Gerencial de Estoque & Saúde Financeira */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Diagnóstico de Estoque
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Produtos sem giro (Parados):</span>
                <span className="font-semibold text-slate-900 dark:text-white">{stock_summary.idle_products_count}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Produtos no estoque mínimo:</span>
                <span className="font-semibold text-amber-600">{stock_summary.low_stock_products_count}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Próximos ao vencimento:</span>
                <span className="font-semibold text-rose-600">{stock_summary.expiring_products_count}</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recomendação IA:</p>
              {stock_summary.recommendations.map((rec, i) => (
                <p key={i} className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded mb-1">
                  💡 {rec}
                </p>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Saúde do Fluxo de Caixa
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Receita Acumulada:</span>
                <span className="font-semibold text-emerald-600">R$ {financial_summary.revenue_this_month.toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Contas Vencidas a Pagar:</span>
                <span className="font-semibold text-rose-600">R$ {financial_summary.overdue_payables.toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Status Geral:</span>
                <Badge variant={financial_summary.cashflow_health === "healthy" ? "success" : "destructive"}>
                  {financial_summary.cashflow_health.toUpperCase()}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
