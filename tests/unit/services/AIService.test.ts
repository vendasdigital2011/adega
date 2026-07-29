import { describe, it, expect, vi } from "vitest"
import { aiService, AIService } from "@/services/AIService"

describe("AIService Unit Tests", () => {
  it("AIService é uma instância singleton", () => {
    const instance1 = AIService.getInstance()
    const instance2 = AIService.getInstance()
    expect(instance1).toBe(instance2)
    expect(instance1).toBe(aiService)
  })

  it("getInsights retorna fallback dinâmico em caso de falha de conexão", async () => {
    vi.spyOn(aiService as any, "getCurrentUserCompanyId").mockResolvedValue("c1111111-1111-1111-1111-111111111111")
    vi.spyOn(aiService as any, "generateDynamicInsights").mockResolvedValue([
      {
        id: "1",
        company_id: "c1111111-1111-1111-1111-111111111111",
        title: "Insight Teste",
        description: "Descrição teste",
        type: "sales",
        priority: "high",
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ])

    const insights = await aiService.getInsights()
    expect(Array.isArray(insights)).toBe(true)
    expect(insights.length).toBeGreaterThan(0)
  })
})
