"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSendAIChatPrompt, useAIChatMessages, useAIChatConversations } from "@/hooks/useAI"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Sparkles, Send, Bot, User, RefreshCw, MessageSquare, ArrowLeft } from "lucide-react"

interface AIChatProps {
  initialPrompt?: string
  onClose?: () => void
}

export function AIChat({ initialPrompt = "", onClose }: AIChatProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{ sender: "user" | "assistant"; text: string }>>([
    {
      sender: "assistant",
      text: "Olá! Sou seu assistente com inteligência artificial para o **Adega Cloud**. Como posso ajudar na gestão da sua adega hoje?",
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sendPromptMutation = useSendAIChatPrompt()
  const { data: conversations } = useAIChatConversations()
  const { data: conversationMessages } = useAIChatMessages(activeConversationId)

  // Atualiza mensagens quando uma conversa histórica é selecionada
  useEffect(() => {
    if (conversationMessages && conversationMessages.length > 0) {
      setMessages(
        conversationMessages.map((m) => ({
          sender: m.sender,
          text: m.message,
        }))
      )
    }
  }, [conversationMessages])

  // Se houver um initialPrompt fornecido externamente, executa ao abrir
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() !== "") {
      handleSend(initialPrompt)
    }
  }, [initialPrompt])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || prompt
    if (!queryText.trim() || sendPromptMutation.isPending) return

    // Adiciona a mensagem do usuário na tela instantaneamente
    const userMsg = queryText
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }])
    if (!textToSend) setPrompt("")

    try {
      const result = await sendPromptMutation.mutateAsync({
        prompt: userMsg,
        conversationId: activeConversationId,
      })

      if (result.conversation_id && result.conversation_id !== activeConversationId) {
        setActiveConversationId(result.conversation_id)
      }

      setMessages((prev) => [...prev, { sender: "assistant", text: result.response_message }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Desculpe, ocorreu um erro ao consultar os dados do sistema. Por favor, tente novamente.",
        },
      ])
    }
  }

  const quickPrompts = [
    "Quanto vendi hoje?",
    "Qual meu lucro este mês?",
    "Qual o saldo atual do caixa?",
    "Quais produtos preciso comprar com urgência?",
    "Quais contas a pagar vencem esta semana?",
  ]

  return (
    <Card className="flex flex-col h-[650px] max-w-4xl mx-auto shadow-2xl border-purple-200 dark:border-purple-950 overflow-hidden">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-yellow-400 p-2 text-slate-950 shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Assistente Virtual Adega Cloud
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </h3>
            <p className="text-xs text-purple-200">Consultas em linguagem natural e dados em tempo real</p>
          </div>
        </div>

        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="text-purple-200 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
      </div>

      {/* Main Chat Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`rounded-full p-2 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-900 text-yellow-400 dark:bg-slate-800"
              }`}
            >
              {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-sm shadow-sm whitespace-pre-wrap ${
                msg.sender === "user"
                  ? "bg-purple-600 text-white rounded-tr-none"
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {sendPromptMutation.isPending && (
          <div className="flex items-center gap-3 text-slate-500 text-xs italic p-2">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
            Analisando banco de dados e preparando resposta...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            disabled={sendPromptMutation.isPending}
            className="text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Input
          placeholder="Faça uma pergunta sobre faturamento, estoque, contas ou compras..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={sendPromptMutation.isPending}
          className="flex-1"
        />
        <Button
          onClick={() => handleSend()}
          disabled={sendPromptMutation.isPending || !prompt.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
