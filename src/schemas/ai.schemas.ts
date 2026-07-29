import { z } from "zod"

export const AIChatQuerySchema = z.object({
  prompt: z.string().min(1, "A pergunta não pode estar vazia.").max(1000, "A pergunta é muito longa."),
  conversation_id: z.string().uuid("ID de conversa inválido.").optional().nullable(),
})

export type AIChatQueryInput = z.infer<typeof AIChatQuerySchema>

export const AIInsightActionSchema = z.object({
  insight_id: z.string().uuid("ID de insight inválido."),
  action: z.enum(["accept", "dismiss"]),
})

export type AIInsightActionInput = z.infer<typeof AIInsightActionSchema>

export const AISalesForecastQuerySchema = z.object({
  period: z.enum(["day", "week", "month"]).default("month"),
})

export type AISalesForecastQueryInput = z.infer<typeof AISalesForecastQuerySchema>

export const AIReportGenerationSchema = z.object({
  type: z.enum(["daily_summary", "weekly_summary", "monthly_summary", "custom"]),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
})

export type AIReportGenerationInput = z.infer<typeof AIReportGenerationSchema>
