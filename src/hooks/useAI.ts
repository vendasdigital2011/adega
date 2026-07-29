"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { aiService } from "@/services/AIService"
import { toast } from "sonner"

export function useAIDashboard() {
  return useQuery({
    queryKey: ["ai-dashboard-summary"],
    queryFn: () => aiService.getDashboardSummary(),
    refetchInterval: 120_000, // Atualiza a cada 2 minutos
  })
}

export function useAIInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => aiService.getInsights(),
    refetchInterval: 60_000,
  })
}

export function useUpdateAIInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "dismiss" }) =>
      aiService.updateInsightStatus(id, action),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "accept" ? "Insight aceito com sucesso!" : "Insight descartado."
      )
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] })
      queryClient.invalidateQueries({ queryKey: ["ai-dashboard-summary"] })
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar insight.")
    },
  })
}

export function useAIChatConversations() {
  return useQuery({
    queryKey: ["ai-conversations"],
    queryFn: () => aiService.getConversations(),
  })
}

export function useAIChatMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-messages", conversationId],
    queryFn: () => (conversationId ? aiService.getConversationMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
  })
}

export function useSendAIChatPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ prompt, conversationId }: { prompt: string; conversationId?: string | null }) =>
      aiService.processChatQuery(prompt, conversationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] })
      if (data.conversation_id) {
        queryClient.invalidateQueries({ queryKey: ["ai-messages", data.conversation_id] })
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar mensagem para a IA.")
    },
  })
}
