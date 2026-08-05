"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { AnalysisType } from "@/services/ai/AIContextService"
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Package,
  Repeat,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"

interface AnalysisCardDef {
  type: AnalysisType
  prompt: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  borderColor: string
}

const OFFICIAL_ANALYSES: AnalysisCardDef[] = [
  {
    type: "overview",
    prompt: "Como está meu negócio? Faça uma análise geral de 360° da minha adega.",
    title: "Analisar minha adega",
    description: "Visão geral da operação: Vendas, Financeiro, Estoque, Produtos e Caixa.",
    icon: Sparkles,
    color: "from-purple-600 to-indigo-600 text-white",
    borderColor: "hover:border-purple-500",
  },
  {
    type: "sales",
    prompt: "Como estão minhas vendas? Avalie faturamento, ticket médio e comparação com o período anterior.",
    title: "Vendas e Faturamento",
    description: "Analise o faturamento bruto, volume de vendas, ticket médio e curva de crescimento.",
    icon: TrendingUp,
    color: "from-emerald-600 to-teal-600 text-white",
    borderColor: "hover:border-emerald-500",
  },
  {
    type: "profit",
    prompt: "Estou tendo lucro? Calcule Faturamento, CMV, Despesas, Lucro Estimado e Margem %.",
    title: "Lucro e Margem",
    description: "Diagnóstico financeiro real: Faturamento vs CMV vs Despesas e Margem líquida.",
    icon: DollarSign,
    color: "from-blue-600 to-cyan-600 text-white",
    borderColor: "hover:border-blue-500",
  },
  {
    type: "inventory",
    prompt: "Como está meu estoque? Avalie valor de custo, potencial de venda, zerados e excesso.",
    title: "Situação do Estoque",
    description: "Valorização do patrimônio em estoque, itens em falta, mínimo e imobilizado.",
    icon: Package,
    color: "from-amber-600 to-orange-600 text-white",
    borderColor: "hover:border-amber-500",
  },
  {
    type: "turnover",
    prompt: "O que vende e o que está parado? Mostre os Top 5 mais vendidos, faturamento e parados.",
    title: "Giro de Produtos",
    description: "Classificação por curva de saída: mais vendidos, maior faturamento e sem giro.",
    icon: Repeat,
    color: "from-violet-600 to-purple-600 text-white",
    borderColor: "hover:border-violet-500",
  },
  {
    type: "purchasing",
    prompt: "O que preciso comprar? Sugira compras prioritárias justificadas por vendas e estoque mínimo.",
    title: "Sugestão de Compras",
    description: "Recomendações com prioridades Urgente, Alta, Média e Baixa para reabastecimento.",
    icon: ShoppingCart,
    color: "from-pink-600 to-rose-600 text-white",
    borderColor: "hover:border-pink-500",
  },
  {
    type: "cash",
    prompt: "Como está meu caixa? Avalie o status do turno, entradas, vendas, sangrias e divergências.",
    title: "Situação do Caixa",
    description: "Conferência de entradas em dinheiro, PIX, cartão, sangrias e saldo esperado.",
    icon: Wallet,
    color: "from-cyan-600 to-blue-600 text-white",
    borderColor: "hover:border-cyan-500",
  },
  {
    type: "alerts",
    prompt: "Quais problemas ou riscos precisam da minha atenção agora? Liste alertas de atenção.",
    title: "Atenção Necessária",
    description: "Matriz consolidada de alertas críticos, avisos de atenção e riscos operacionais.",
    icon: AlertTriangle,
    color: "from-rose-600 to-red-600 text-white",
    borderColor: "hover:border-rose-500",
  },
]

interface SmartAnalyticsGridProps {
  onSelectAnalysis: (type: AnalysisType, prompt: string) => void
  isLoading?: boolean
  selectedType?: AnalysisType | null
}

export function SmartAnalyticsGrid({ onSelectAnalysis, isLoading, selectedType }: SmartAnalyticsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {OFFICIAL_ANALYSES.map((card) => {
        const Icon = card.icon
        const isSelected = selectedType === card.type

        return (
          <Card
            key={card.type}
            onClick={() => !isLoading && onSelectAnalysis(card.type, card.prompt)}
            className={`p-5 cursor-pointer transition-all duration-200 hover:shadow-lg border group relative overflow-hidden flex flex-col justify-between ${card.borderColor} ${
              isSelected ? "ring-2 ring-purple-600 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20" : "bg-card/60 backdrop-blur-sm"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground uppercase">
                  IA Oficial
                </Badge>
              </div>

              <h3 className="font-bold text-base text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Analisar Agora</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
