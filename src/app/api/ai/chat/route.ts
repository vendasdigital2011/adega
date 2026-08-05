import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { AIContextService, AnalysisType, PeriodType } from "@/services/ai/AIContextService"
import { logClientError } from "@/lib/logger"

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = "req_ai_" + Math.random().toString(36).substring(2, 9)

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://yqhwtgaqxgptletgxklr.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_GL13qCWkRt35fIQGE6_T3Q_ctp2XCEq"

    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    })

    // Valida sessão do usuário autenticado no Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "AI_PERMISSION_ERROR",
          message: "Sessão expirada. Faça login novamente para consultar as análises inteligentes.",
        },
        { status: 401 }
      )
    }

    // Resolucao resiliente de company_id
    let companyId: string | null = null

    try {
      const { data: profile } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", user.id)
        .single()
      companyId = profile?.company_id || null
    } catch (e) {}

    const activeCompanyId = companyId || "c1111111-1111-1111-1111-111111111111"
    const body = await req.json()
    const { prompt, analysisType = "free_chat", period = "30_days", customStart, customEnd } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        {
          error: "INVALID_PROMPT",
          message: "Informe uma pergunta ou selecione uma análise.",
        },
        { status: 400 }
      )
    }

    // Coleta o contexto estruturado agregando dados reais do Supabase
    const contextPayload = await AIContextService.assembleContext(
      activeCompanyId,
      user.id,
      prompt,
      analysisType as AnalysisType,
      period as PeriodType,
      customStart,
      customEnd
    )

    const openaiApiKey = process.env.OPENAI_API_KEY
    let aiResponseMessage: string | null = null
    let structuredAnalysis: any = null

    if (openaiApiKey && !openaiApiKey.includes("placeholder")) {
      try {
        const systemInstruction = `Você é o Diretor Financeiro e Especialista em Gestão do sistema Adega Cloud.
Analise os DADOS REAIS da empresa fornecidos no contexto e retorne a resposta OBRIGATORIAMENTE em formato JSON com o seguinte schema:
{
  "title": "Nome descritivo da análise",
  "status": "boa" | "atenção" | "crítica",
  "summary": "Resumo executivo de 2 a 3 parágrafos objetivos.",
  "indicators": [
    { "name": "Indicador", "value": "R$ Valor", "change": "+X%" }
  ],
  "positive_points": ["Ponto positivo 1 (máx 3)"],
  "attention_points": ["Ponto de atenção 1 (máx 3)"],
  "recommendations": ["Recomendação prática 1 (máx 5)"],
  "priority_action": "Ação prioritária que o proprietário deve executar hoje."
}

Regras Fundamentais:
1. NUNCA invente números, vendas ou dados não presentes no contexto.
2. Se o dado não existir para o período selecionado, retorne status "atenção" e informe no resumo: "Não existem dados suficientes registrados no sistema para esta análise no período selecionado."
3. Diferencie rigorosamente Faturamento de Lucro. Lucro = Faturamento - CMV - Despesas.
4. Responda apenas com o objeto JSON sem marcadores markdown adicionais.`

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemInstruction },
              {
                role: "user",
                content: `[PERÍODO DE ANÁLISE]: ${contextPayload.periodLabel}\n[CONTEXTO DE DADOS REAIS DA ADEGA]:\n${contextPayload.formattedContextText}\n\n[ANÁLISE SOLICITADA / PERGUNTA]:\n${prompt}`,
              },
            ],
            temperature: 0.3,
          }),
        })

        if (openaiRes.ok) {
          const aiJson = await openaiRes.json()
          const rawContent = aiJson.choices?.[0]?.message?.content || ""
          try {
            structuredAnalysis = JSON.parse(rawContent)
            aiResponseMessage = structuredAnalysis.summary
          } catch (e) {
            aiResponseMessage = rawContent
          }
        }
      } catch (e) {
        logClientError("ai.openai_api_error", e, { requestId, companyId })
      }
    }

    if (!aiResponseMessage && !structuredAnalysis) {
      if (!openaiApiKey || openaiApiKey.includes("placeholder")) {
        return NextResponse.json(
          {
            error: "AI_OPENAI_ERROR",
            message: "A chave OPENAI_API_KEY não foi configurada no ambiente do servidor.",
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        {
          error: "AI_TIMEOUT",
          message: "A API da OpenAI não respondeu a tempo. Tente novamente em instantes.",
        },
        { status: 502 }
      )
    }

    const durationMs = Date.now() - startTime

    return NextResponse.json({
      success: true,
      conversation_id: "conv_" + requestId,
      response_message: aiResponseMessage,
      structured_analysis: structuredAnalysis,
      context_data: contextPayload,
      durationMs,
    })
  } catch (error: any) {
    logClientError("ai.chat_route_exception", error, { requestId })
    return NextResponse.json(
      {
        error: "AI_SUPABASE_ERROR",
        message: error.message || "Erro no processamento da análise de dados.",
      },
      { status: 500 }
    )
  }
}
