// Logger estruturado único do projeto — server (middleware/API routes,
// Edge + Node) e client (componentes React) passam pelos mesmos helpers de
// sanitização, então nenhum dos dois depende da disciplina de quem escreve
// o log individual.
//
// Sem dependência externa de propósito: `middleware.ts` roda em Edge Runtime
// por padrão no Next.js, que não tem as APIs de Node (worker_threads etc.)
// que loggers como Pino precisam para o transporte performático. JSON via
// console.log funciona igual nas duas runtimes, e a Vercel já coleta stdout
// de ambas como log estruturado nativamente — não há ganho em trocar por uma
// lib externa para o volume de tráfego desta aplicação.

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"

// Chaves nunca podem aparecer em texto puro no log, em qualquer profundidade
// de aninhamento, comparação sem diferenciar maiúsculas/minúsculas.
const SENSITIVE_KEYS = [
  "password",
  "senha",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "apikey",
  "api_key",
  "secret",
  "authorization",
  "cookie",
  "sessiontoken",
  "session_token",
  "otp",
  "cvv",
  "cardnumber",
  "card_number",
  "privatekey",
  "private_key",
  "connectionstring",
  "connection_string",
  "serviceRoleKey".toLowerCase(),
  "service_role_key",
  "jwt",
]

const MAX_DEPTH = 6
const MAX_STRING_LENGTH = 2000

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-\s]/g, "_")
  return SENSITIVE_KEYS.some((k) => normalized === k || normalized.includes(k))
}

// Redação recursiva — funciona para objetos aninhados, arrays, headers e
// query params. Nunca lança: uma estrutura circular ou não serializável cai
// para "[unserializable]" em vez de derrubar quem estava só tentando logar.
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value

  if (depth >= MAX_DEPTH) return "[max depth]"

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? value.slice(0, MAX_STRING_LENGTH) + "…[truncated]" : value
  }

  if (typeof value !== "object") return value

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1))
  }

  try {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? "[REDACTED]" : redact(val, depth + 1)
    }
    return out
  } catch {
    return "[unserializable]"
  }
}

export interface LogFields {
  requestId?: string
  correlationId?: string
  userId?: string
  tenantId?: string
  action?: string
  module?: string
  route?: string
  method?: string
  statusCode?: number
  durationMs?: number
  errorCode?: string
  eventName?: string
  result?: "success" | "failure"
  [key: string]: unknown
}

function baseEntry(level: LogLevel, message: string, fields: LogFields = {}) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    service: "adega-cloud",
    environment: process.env.NODE_ENV || "development",
    message,
  }
  // redact(fields) — não redact(val) por campo — porque a checagem de chave
  // sensível (isSensitiveKey) só acontece dentro do próprio redact() ao
  // iterar um objeto; chamar redact(val) por valor perde o nome do campo
  // (ex.: um campo chamado "token" com valor string passava direto).
  const redactedFields = redact(fields) as Record<string, unknown>
  for (const [key, val] of Object.entries(redactedFields)) {
    if (val !== undefined && val !== "") entry[key] = val
  }
  return entry
}

// Para middleware.ts (Edge) e Route Handlers (Node) — única superfície
// server-side real desta aplicação hoje (a maior parte da lógica roda no
// navegador direto contra o Supabase, sem servidor intermediário).
export function logServer(level: LogLevel, message: string, fields: LogFields = {}): void {
  const entry = baseEntry(level, message, fields)
  const line = JSON.stringify(entry)
  if (level === "error" || level === "fatal") {
    console.error(line)
  } else if (level === "warn") {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export function generateRequestId(): string {
  return `req_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

// Diagnóstico leve de componente client — só aparece em desenvolvimento
// (debug: "diagnóstico detalhado, habilitado apenas quando necessário").
export function logClientDebug(action: string, context: Record<string, unknown> = {}): void {
  if (process.env.NODE_ENV === "production") return
  const entry = {
    timestamp: new Date().toISOString(),
    level: "debug" as LogLevel,
    service: "adega-cloud-web",
    environment: process.env.NODE_ENV || "development",
    action,
    ...(redact(context) as Record<string, unknown>),
  }
  console.log(JSON.stringify(entry))
}

// Para componentes React ("use client") — console.error aqui só é visível no
// navegador do próprio usuário (não vaza para terceiros), mas passa pela
// mesma sanitização: no dia em que uma ferramenta de monitoramento (Sentry
// etc.) for conectada, ela costuma capturar console.error automaticamente, e
// não deve herdar nenhum dado sensível por hábito de dev.
export function logClientError(action: string, error: unknown, context: Record<string, unknown> = {}): void {
  const safeError =
    error && typeof error === "object"
      ? redact({ message: (error as { message?: string }).message, code: (error as { code?: string }).code })
      : redact(error)

  const entry = {
    timestamp: new Date().toISOString(),
    level: "error" as LogLevel,
    service: "adega-cloud-web",
    environment: process.env.NODE_ENV || "development",
    action,
    error: safeError,
    ...redact(context) as Record<string, unknown>,
  }
  console.error(JSON.stringify(entry))
}
