"use client"

import React, { useState } from "react"
import { AIDashboard } from "@/features/ai/components/AIDashboard"
import { AIChat } from "@/features/ai/components/AIChat"
import { AISalesForecastView } from "@/features/ai/components/AISalesForecastView"
import { AIPurchasingSuggestionsView } from "@/features/ai/components/AIPurchasingSuggestionsView"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Sparkles, Bot, TrendingUp, ShoppingCart, LayoutDashboard } from "lucide-react"

export default function AIPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "forecast" | "purchasing">("dashboard")
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>("")

  const handleOpenChat = (prompt?: string) => {
    if (prompt) {
      setChatInitialPrompt(prompt)
    }
    setActiveTab("chat")
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Inteligência Artificial & Insights</h1>
            <Badge className="bg-purple-600 text-white font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> IA v1.0
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Assistente inteligente, análise preditiva de vendas, sugestões de compras e saúde financeira.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <Button
            size="sm"
            variant={activeTab === "dashboard" ? "default" : "ghost"}
            onClick={() => setActiveTab("dashboard")}
            className={activeTab === "dashboard" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
          >
            <LayoutDashboard className="h-4 w-4 mr-1.5" />
            Painel Geral
          </Button>

          <Button
            size="sm"
            variant={activeTab === "chat" ? "default" : "ghost"}
            onClick={() => handleOpenChat()}
            className={activeTab === "chat" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
          >
            <Bot className="h-4 w-4 mr-1.5" />
            Chat IA
          </Button>

          <Button
            size="sm"
            variant={activeTab === "forecast" ? "default" : "ghost"}
            onClick={() => setActiveTab("forecast")}
            className={activeTab === "forecast" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Previsão de Vendas
          </Button>

          <Button
            size="sm"
            variant={activeTab === "purchasing" ? "default" : "ghost"}
            onClick={() => setActiveTab("purchasing")}
            className={activeTab === "purchasing" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Sugestão de Compras
          </Button>
        </div>
      </div>

      {/* Tab View Container */}
      {activeTab === "dashboard" && <AIDashboard onOpenChat={handleOpenChat} />}
      {activeTab === "chat" && <AIChat initialPrompt={chatInitialPrompt} onClose={() => setActiveTab("dashboard")} />}
      {activeTab === "forecast" && <AISalesForecastView />}
      {activeTab === "purchasing" && <AIPurchasingSuggestionsView />}
    </div>
  )
}
