// Logger estruturado único do projeto — server (middleware/API routes,
// Edge + Node) e client (componentes React) passam pelos mesmos helpers de
// sanitização, então nenhum dos dois depende da disciplina de quem escreve
// o log individual.

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"

// Chaves de credenciais e segredos (Redação completa -> "[REDACTED]")
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
  "servicerolekey",
  "service_role_key",
  "jwt",
]

// Chaves de Dados Pessoais Identificáveis (LGPD / PII -> Mascaramento parcial ou "[PII_MASKED]")
const PII_KEYS = [
  "cpf",
  "cnpj",
  "email",
  "e_mail",
  "telefone",
  "phone",
  "celular",
  "mobile",
  "endereco",
  "address",
  "bairro",
  "cep",
  "zipcode",
  "rg",
  "birthdate",
  "data_nascimento",
  "pix",
  "card_holder",
  "titular_cartao",
]

const MAX_DEPTH = 6
const MAX_STRING_LENGTH = 2000

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-\s]/g, "_")
  return SENSITIVE_KEYS.some((k) => normalized === k || normalized.includes(k))
}

function isPiiKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-\s]/g, "_")
  return PII_KEYS.some((k) => normalized === k || normalized.includes(k))
}

export function maskPiiValue(value: unknown, keyName: string = ""): unknown {
  if (typeof value !== "string") return "[PII_MASKED]"

  // E-mail: u***r@domain.com
  if (value.includes("@")) {
    const parts = value.split("@")
    const name = parts[0]
    const domain = parts[1]
    const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name.slice(0, 1)}***`
    return `${maskedName}@${domain}`
  }

  const cleanDigits = value.replace(/\D/g, "")
  const isPhoneKey = /phone|telefone|celular|mobile/i.test(keyName)

  // Telefone / Celular (10 ou 11 dígitos quando a chave for telefone)
  if (isPhoneKey && (cleanDigits.length === 10 || cleanDigits.length === 11)) {
    return `(**) *****-${cleanDigits.slice(-4)}`
  }

  // CPF (11 dígitos): ***.***.123-45
  if (cleanDigits.length === 11) {
    return `***.***.${cleanDigits.slice(6, 9)}-${cleanDigits.slice(9)}`
  }

  // CNPJ (14 dígitos): **.***.***/0001-90
  if (cleanDigits.length === 14) {
    return `**.***.***/${cleanDigits.slice(8, 12)}-${cleanDigits.slice(12)}`
  }

  // Telefone genérico com código de área ou formatação
  if (cleanDigits.length >= 10 && cleanDigits.length <= 11) {
    return `(**) *****-${cleanDigits.slice(-4)}`
  }

  return "[PII_MASKED]"
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
      if (isSensitiveKey(key)) {
        out[key] = "[REDACTED]"
      } else if (isPiiKey(key)) {
        out[key] = maskPiiValue(val, key)
      } else {
        out[key] = redact(val, depth + 1)
      }
    }
    return out
  } catch {
    return "[unserializable]"
  }
}

export interface LogFields {
  requestId?: string
  correlationId?: string
  traceId?: string
  userId?: string
  tenantId?: string
  sessionId?: string
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

  const redactedFields = redact(fields) as Record<string, unknown>
  for (const [key, val] of Object.entries(redactedFields)) {
    if (val !== undefined && val !== "") entry[key] = val
  }
  return entry
}

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
    ...(redact(context) as Record<string, unknown>),
  }
  console.error(JSON.stringify(entry))
}

// Inicialização automática de manipuladores de exceções não tratadas no navegador
if (typeof window !== "undefined" && !(window as any).__ADEGA_LOG_LISTENERS_INITIALIZED__) {
  ;(window as any).__ADEGA_LOG_LISTENERS_INITIALIZED__ = true

  window.addEventListener("unhandledrejection", (event) => {
    logClientError("system.unhandled_rejection", event.reason || "Unhandled Promise Rejection")
  })

  window.addEventListener("error", (event) => {
    logClientError("system.uncaught_error", event.error || event.message)
  })
}
