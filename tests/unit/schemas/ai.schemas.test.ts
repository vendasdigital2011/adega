import { describe, it, expect } from "vitest"
import {
  AIChatQuerySchema,
  AIInsightActionSchema,
  AISalesForecastQuerySchema,
  AIReportGenerationSchema,
} from "@/schemas/ai.schemas"

describe("AI Schemas Validation", () => {
  describe("AIChatQuerySchema", () => {
    it("valida prompt válido", () => {
      const result = AIChatQuerySchema.safeParse({ prompt: "Quanto vendi hoje?" })
      expect(result.success).toBe(true)
    })

    it("rejeita prompt vazio", () => {
      const result = AIChatQuerySchema.safeParse({ prompt: "" })
      expect(result.success).toBe(false)
    })
  })

  describe("AIInsightActionSchema", () => {
    it("aceita ação válida de accept", () => {
      const result = AIInsightActionSchema.safeParse({
        insight_id: "123e4567-e89b-12d3-a456-426614174000",
        action: "accept",
      })
      expect(result.success).toBe(true)
    })

    it("aceita ação válida de dismiss", () => {
      const result = AIInsightActionSchema.safeParse({
        insight_id: "123e4567-e89b-12d3-a456-426614174000",
        action: "dismiss",
      })
      expect(result.success).toBe(true)
    })

    it("rejeita ação inválida", () => {
      const result = AIInsightActionSchema.safeParse({
        insight_id: "123e4567-e89b-12d3-a456-426614174000",
        action: "invalid_action",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("AISalesForecastQuerySchema", () => {
    it("valida período de previsão", () => {
      expect(AISalesForecastQuerySchema.safeParse({ period: "day" }).success).toBe(true)
      expect(AISalesForecastQuerySchema.safeParse({ period: "week" }).success).toBe(true)
      expect(AISalesForecastQuerySchema.safeParse({ period: "month" }).success).toBe(true)
    })
  })

  describe("AIReportGenerationSchema", () => {
    it("valida tipo de relatório", () => {
      expect(AIReportGenerationSchema.safeParse({ type: "daily_summary" }).success).toBe(true)
    })
  })
})
