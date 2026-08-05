"use client"

import React, { useState } from "react"
import { useSendAIChatPrompt } from "@/hooks/useAI"
import { PeriodSelector } from "@/features/ai/components/PeriodSelector"
import { SmartAnalyticsGrid } from "@/features/ai/components/SmartAnalyticsGrid"
import { SmartAnalysisResult, StructuredAnalysis } from "@/features/ai/components/SmartAnalysisResult"
import { AIChat } from "@/features/ai/components/AIChat"
import { PeriodType, AnalysisType } from "@/services/ai/AIContextService"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Loading } from "@/components/ui/Loading"
import { Sparkles, Search, MessageSquare, Bot, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

export default function AIPage() {
  const [period, setPeriod] = useState<PeriodType>("30_days")
  const [freePrompt, setFreePrompt] = useState("")
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<AnalysisType | null>(null)
  const [analysisResult, setAnalysisResult] = useState<StructuredAnalysis | null>(null)
  const [rawTextResult, setRawTextResult] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"smart_analytics" | "chat">("smart_analytics")
  const [chatPrompt, setChatPrompt] = useState<string>("")

  const sendPromptMutation = useSendAIChatPrompt()

  const handleRunAnalysis = async (type: AnalysisType, promptText: string) => {
    setSelectedAnalysisType(type)
    setAnalysisResult(null)
    setRawTextResult(null)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          analysisType: type,
          period,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Falha ao gerar análise dos dados.")
      }

      if (data.structured_analysis) {
        setAnalysisResult(data.structured_analysis)
      } else {
        setRawTextResult(data.response_message)
      }
      toast.success("Análise inteligente concluída com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar a IA.")
    }
  }

  const handleFreeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!freePrompt.trim()) return
    handleRunAnalysis("free_chat", freePrompt)
  }

  const handleOpenChat = (prompt?: string) => {
    if (prompt) {
      setChatPrompt(prompt)
    }
    setActiveTab("chat")
  }

  const periodLabels: Record<PeriodType, string> = {
    today: "Hoje",
    "7_days": "Últimos 7 dias",
    "30_days": "Últimos 30 dias",
    this_month: "Este mês",
    last_month: "Mês anterior",
    "90_days": "Últimos 90 dias",
    custom: "Período personalizado",
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Análises Inteligentes
            </h1>
            <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Adega AI 1.0
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Diagnósticos executivos da sua adega baseados estritamente em dados reais do Supabase.
          </p>
        </div>

        {/* Period Selector and Chat Toggle */}
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />

          <Button
            size="sm"
            variant={activeTab === "chat" ? "default" : "outline"}
            onClick={() => setActiveTab(activeTab === "chat" ? "smart_analytics" : "chat")}
            className={activeTab === "chat" ? "bg-purple-600 hover:bg-purple-700 text-white font-semibold" : "font-semibold"}
          >
            {activeTab === "chat" ? (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" /> Ver Cards de Análise
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-1.5" /> Chat IA Livre
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Tab View */}
      {activeTab === "chat" ? (
        <AIChat initialPrompt={chatPrompt} onClose={() => setActiveTab("smart_analytics")} />
      ) : (
        <div className="space-y-6">
          {/* Free Prompt Question Bar */}
          <Card className="p-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-background border-purple-200 dark:border-purple-900/40 shadow-sm">
            <form onSubmit={handleFreeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-purple-600 dark:text-purple-400" />
                <Input
                  type="text"
                  placeholder="Pergunte qualquer coisa sobre sua adega... (ex: Qual produto me dá mais lucro?)"
                  value={freePrompt}
                  onChange={(e) => setFreePrompt(e.target.value)}
                  className="pl-10 h-10 border-purple-200 dark:border-purple-900/60 bg-background/80 focus-visible:ring-purple-500 text-sm"
                />
              </div>
              <Button
                type="submit"
                disabled={sendPromptMutation.isPending || !freePrompt.trim()}
                className="w-full sm:w-auto h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-2 shadow-sm shrink-0"
              >
                <Sparkles className="h-4 w-4" /> Perguntar à IA
              </Button>
            </form>
          </Card>

          {/* Loading Indicator for Analysis */}
          {selectedAnalysisType && !analysisResult && !rawTextResult && (
            <Card className="p-12 text-center border-purple-200 dark:border-purple-900/50 bg-card/60 backdrop-blur-md shadow-lg space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-purple-600/10 flex items-center justify-center text-purple-600 animate-spin">
                  <RefreshCw className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Analisando seus dados...</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Agregando vendas, financeiro, estoque e caixa para a empresa no período:{" "}
                  <strong>{periodLabels[period]}</strong>.
                </p>
              </div>
            </Card>
          )}

          {/* Results Presentation Component */}
          {(analysisResult || rawTextResult) && (
            <SmartAnalysisResult
              analysis={analysisResult}
              rawResponse={rawTextResult || undefined}
              periodLabel={periodLabels[period]}
              onReset={() => {
                setAnalysisResult(null)
                setRawTextResult(null)
                setSelectedAnalysisType(null)
              }}
              onOpenChat={handleOpenChat}
            />
          )}

          {/* The Official 8 Analyses Cards Grid */}
          {!analysisResult && !rawTextResult && !selectedAnalysisType && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Análises Principais (Selecione uma opção)
                </h2>
                <span className="text-xs text-muted-foreground font-mono">
                  8 análises oficiais pré-configuradas
                </span>
              </div>

              <SmartAnalyticsGrid
                onSelectAnalysis={handleRunAnalysis}
                isLoading={!!selectedAnalysisType}
                selectedType={selectedAnalysisType}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
