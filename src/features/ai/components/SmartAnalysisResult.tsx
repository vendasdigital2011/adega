"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Lightbulb,
  Zap,
  ArrowLeft,
  Sparkles,
} from "lucide-react"

export interface StructuredAnalysis {
  title: string
  status: "boa" | "atenção" | "crítica" | "boa " | "atenção "
  summary: string
  indicators?: Array<{ name: string; value: string; change?: string }>
  positive_points?: string[]
  attention_points?: string[]
  recommendations?: string[]
  priority_action?: string
}

interface SmartAnalysisResultProps {
  analysis: StructuredAnalysis | null
  rawResponse?: string
  periodLabel: string
  onReset: () => void
  onOpenChat: (prompt: string) => void
}

export function SmartAnalysisResult({
  analysis,
  rawResponse,
  periodLabel,
  onReset,
  onOpenChat,
}: SmartAnalysisResultProps) {
  if (!analysis && !rawResponse) return null

  const status = (analysis?.status || "atenção").trim().toLowerCase()

  const getStatusBadge = () => {
    if (status === "boa") {
      return (
        <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="h-4 w-4" /> 🟢 Situação: Boa
        </Badge>
      )
    }
    if (status === "crítica" || status === "critica") {
      return (
        <Badge className="bg-rose-600 text-white font-bold text-xs px-3 py-1 flex items-center gap-1.5 shadow-sm">
          <XCircle className="h-4 w-4" /> 🔴 Situação: Crítica
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-500 text-white font-bold text-xs px-3 py-1 flex items-center gap-1.5 shadow-sm">
        <AlertTriangle className="h-4 w-4" /> 🟡 Situação: Atenção
      </Badge>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-2 text-xs font-semibold">
          <ArrowLeft className="h-4 w-4" /> Voltar às Análises
        </Button>
        <span className="text-xs text-muted-foreground font-mono">
          Período Consultado: <strong className="text-foreground">{periodLabel}</strong>
        </span>
      </div>

      <Card className="p-6 border-purple-200 dark:border-purple-900/60 bg-card/80 backdrop-blur-md shadow-xl space-y-6">
        {/* Header Title and Status */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Diagnóstico Oficial de Inteligência
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {analysis?.title || "Resultado da Análise"}
            </h2>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Priority Action (Se Houver) */}
        {analysis?.priority_action && (
          <div className="p-4 bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-purple-900/20 border border-purple-500/40 rounded-xl flex items-start gap-3.5 shadow-sm">
            <Zap className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Ação Prioritária Recomendada:
              </h4>
              <p className="text-sm font-semibold text-foreground mt-1">
                {analysis.priority_action}
              </p>
            </div>
          </div>
        )}

        {/* Summary Text */}
        <div className="space-y-3 text-sm text-foreground/90 leading-relaxed font-normal bg-muted/30 p-4 rounded-xl border border-border/40">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resumo Executivo da Operação:
          </h4>
          <p className="whitespace-pre-line">{analysis?.summary || rawResponse}</p>
        </div>

        {/* Key Indicators Grid */}
        {analysis?.indicators && analysis.indicators.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Principais Indicadores do Período
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {analysis.indicators.map((ind, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-card border border-border/80 rounded-xl flex flex-col justify-between shadow-sm hover:border-purple-500/40 transition-colors"
                >
                  <span className="text-xs text-muted-foreground font-medium truncate">{ind.name}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-bold text-foreground">{ind.value}</span>
                    {ind.change && (
                      <span
                        className={`text-xs font-semibold font-mono ${
                          ind.change.startsWith("+")
                            ? "text-emerald-500"
                            : ind.change.startsWith("-")
                            ? "text-rose-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {ind.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points Columns (Positivos e Atenção) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pontos Positivos */}
          {analysis?.positive_points && analysis.positive_points.length > 0 && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Pontos Positivos (Destaques)
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {analysis.positive_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pontos de Atenção */}
          {analysis?.attention_points && analysis.attention_points.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Pontos de Atenção & Riscos
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/90">
                {analysis.attention_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recommendations List */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4" /> Recomendações Estratégicas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-background/50 rounded-lg border border-purple-500/10">
                  <span className="font-bold text-purple-500">{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask Question Followup Button */}
        <div className="pt-2 flex justify-end">
          <Button
            onClick={() => onOpenChat(`Fazer pergunta complementar sobre a análise: ${analysis?.title || "Geral"}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-2"
          >
            <Sparkles className="h-4 w-4" /> Fazer Pergunta Livre sobre este Resultado
          </Button>
        </div>
      </Card>
    </div>
  )
}
