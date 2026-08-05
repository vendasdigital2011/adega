import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { AIContextService } from "@/services/ai/AIContextService"
import { logClientError } from "@/lib/logger"

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = "req_ai_" + Math.random().toString(36).substring(2, 9)

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Prioridade 2: Validação de Variáveis do Supabase
    if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
      return NextResponse.json(
        {
          error: "SUPABASE_CONFIGURATION_ERROR",
          message: "Variável NEXT_PUBLIC_SUPABASE_URL não configurada no ambiente da Vercel/Servidor.",
        },
        { status: 500 }
      )
    }

    if (!supabaseAnonKey || supabaseAnonKey.includes("placeholder")) {
      return NextResponse.json(
        {
          error: "SUPABASE_CONFIGURATION_ERROR",
          message: "Variável NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada no ambiente.",
        },
        { status: 500 }
      )
    }

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

    // Arquitetura Obrigatória: Validar usuário autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "AUTHENTICATION_ERROR",
          message: "Sessão não encontrada ou expirada. Faça login para consultar a IA.",
        },
        { status: 401 }
      )
    }

    // Regra Crítica: Descobrir company_id REAL do usuário (nunca hardcoded)
    const { data: profile, error: profileErr } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (profileErr || !profile?.company_id) {
      return NextResponse.json(
        {
          error: "PERMISSION_ERROR",
          message: "Empresa do usuário não identificada para isolamento dos dados.",
        },
        { status: 403 }
      )
    }

    const companyId = profile.company_id
    const body = await req.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        {
          error: "INVALID_PROMPT",
          message: "Informe uma pergunta válida.",
        },
        { status: 400 }
      )
    }

    // Coleta o contexto estritamente filtrado pela empresa do usuário
    const contextPayload = await AIContextService.assembleContext(companyId, user.id, prompt)

    // Prioridade 4: Validação da Chave da OpenAI no Servidor
    const openaiApiKey = process.env.OPENAI_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    let aiResponseMessage: string | null = null

    if (openaiApiKey && !openaiApiKey.includes("placeholder")) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Você é o assistente executivo e especialista em gestão do sistema Adega Cloud. Responda exclusivamente com base nos dados reais do sistema fornecidos no contexto. Se não houver dados suficientes, informe claramente ao usuário que os dados não estão registrados.",
              },
              {
                role: "user",
                content: `[CONTEXTO DE DADOS REAIS DA ADEGA]:\n${contextPayload.formattedContextText}\n\n[PERGUNTA DO USUÁRIO]:\n${prompt}`,
              },
            ],
            temperature: 0.5,
          }),
        })

        if (openaiRes.ok) {
          const aiJson = await openaiRes.json()
          aiResponseMessage = aiJson.choices?.[0]?.message?.content || null
        }
      } catch (e) {
        logClientError("ai.openai_api_error", e, { requestId, companyId })
      }
    }

    // Fallback secundário para Gemini se configurado no servidor
    if (!aiResponseMessage && geminiApiKey && !geminiApiKey.includes("placeholder")) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `Você é o assistente virtual do Adega Cloud.\n[CONTEXTO REAIS]:\n${contextPayload.formattedContextText}\n\n[PERGUNTA]:\n${prompt}`,
                    },
                  ],
                },
              ],
            }),
          }
        )

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json()
          aiResponseMessage = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || null
        }
      } catch (e) {
        logClientError("ai.gemini_api_error", e, { requestId, companyId })
      }
    }

    // Se nenhuma API de LLM estiver configurada no servidor:
    if (!aiResponseMessage) {
      if (!openaiApiKey || openaiApiKey.includes("placeholder")) {
        return NextResponse.json(
          {
            error: "OPENAI_CONFIGURATION_ERROR",
            message: "A chave OPENAI_API_KEY não foi configurada nas Variáveis de Ambiente da Vercel.",
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        {
          error: "OPENAI_API_ERROR",
          message: "Falha na comunicação com a API da OpenAI.",
        },
        { status: 502 }
      )
    }

    const durationMs = Date.now() - startTime

    // Log estruturado server-side sem expor chaves
    console.log(
      JSON.stringify({
        requestId,
        userId: user.id,
        companyId,
        durationMs,
        status: 200,
        module: "AI_CHAT",
      })
    )

    return NextResponse.json({
      success: true,
      conversation_id: "conv_" + requestId,
      response_message: aiResponseMessage,
      context_data: contextPayload,
    })
  } catch (error: any) {
    logClientError("ai.chat_route_exception", error, { requestId })
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro interno no servidor de IA.",
      },
      { status: 500 }
    )
  }
}
