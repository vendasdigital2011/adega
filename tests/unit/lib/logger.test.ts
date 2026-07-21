import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { redact, logServer, logClientError, logClientDebug, generateRequestId } from "@/lib/logger"

describe("redact", () => {
  it("redige campos sensíveis no nível superior", () => {
    const result = redact({ password: "hunter2", token: "abc", ok: "fine" }) as Record<string, unknown>
    expect(result.password).toBe("[REDACTED]")
    expect(result.token).toBe("[REDACTED]")
    expect(result.ok).toBe("fine")
  })

  it("é case-insensitive e tolera snake_case/kebab/espaço", () => {
    const result = redact({
      PASSWORD: "x",
      Access_Token: "y",
      "api-key": "z",
      Authorization: "Bearer abc",
    }) as Record<string, unknown>
    expect(result.PASSWORD).toBe("[REDACTED]")
    expect(result.Access_Token).toBe("[REDACTED]")
    expect(result["api-key"]).toBe("[REDACTED]")
    expect(result.Authorization).toBe("[REDACTED]")
  })

  it("redige em objetos aninhados", () => {
    const result = redact({
      user: { name: "Maria", credentials: { password: "hunter2" } },
    }) as any
    expect(result.user.name).toBe("Maria")
    expect(result.user.credentials.password).toBe("[REDACTED]")
  })

  it("redige dentro de arrays de objetos", () => {
    const result = redact([{ token: "a" }, { token: "b", name: "ok" }]) as any[]
    expect(result[0].token).toBe("[REDACTED]")
    expect(result[1].token).toBe("[REDACTED]")
    expect(result[1].name).toBe("ok")
  })

  it("redige headers e query params (chaves comuns de requisição)", () => {
    const result = redact({
      headers: { authorization: "Bearer xyz", cookie: "session=abc", "x-request-id": "req_1" },
      query: { session_token: "abc", page: "1" },
    }) as any
    expect(result.headers.authorization).toBe("[REDACTED]")
    expect(result.headers.cookie).toBe("[REDACTED]")
    expect(result.headers["x-request-id"]).toBe("req_1")
    expect(result.query.session_token).toBe("[REDACTED]")
    expect(result.query.page).toBe("1")
  })

  it("cobre a lista de campos proibidos do prompt de auditoria", () => {
    const forbidden = {
      password: "a",
      senha: "a",
      token: "a",
      refreshToken: "a",
      apiKey: "a",
      secret: "a",
      cookie: "a",
      authorization: "a",
      sessionToken: "a",
      otp: "a",
      cvv: "a",
      cardNumber: "a",
      privateKey: "a",
      connectionString: "a",
      serviceRoleKey: "a",
      jwt: "a",
    }
    const result = redact(forbidden) as Record<string, unknown>
    for (const key of Object.keys(forbidden)) {
      expect(result[key], `campo "${key}" deveria estar redigido`).toBe("[REDACTED]")
    }
  })

  it("não lança em estrutura circular — cai para um valor seguro", () => {
    const circular: Record<string, unknown> = { name: "x" }
    circular.self = circular
    expect(() => redact(circular)).not.toThrow()
  })

  it("trunca strings muito longas", () => {
    const long = "a".repeat(3000)
    const result = redact({ note: long }) as Record<string, unknown>
    expect((result.note as string).length).toBeLessThan(long.length)
    expect(result.note).toContain("…[truncated]")
  })

  it("preserva null/undefined/valores primitivos", () => {
    expect(redact(null)).toBeNull()
    expect(redact(undefined)).toBeUndefined()
    expect(redact(42)).toBe(42)
    expect(redact(true)).toBe(true)
  })
})

describe("logServer", () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("info/debug vão para console.log como JSON válido com os campos certos", () => {
    logServer("info", "Usuário criado", { requestId: "req_1", route: "/api/users", statusCode: 201 })
    expect(logSpy).toHaveBeenCalledOnce()
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string)
    expect(parsed.level).toBe("info")
    expect(parsed.message).toBe("Usuário criado")
    expect(parsed.requestId).toBe("req_1")
    expect(parsed.route).toBe("/api/users")
    expect(parsed.statusCode).toBe(201)
    expect(parsed.service).toBe("adega-cloud")
    expect(parsed.timestamp).toBeTruthy()
  })

  it("warn vai para console.warn", () => {
    logServer("warn", "Acesso negado", { route: "/audit" })
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(logSpy).not.toHaveBeenCalled()
  })

  it("error e fatal vão para console.error", () => {
    logServer("error", "Falha técnica")
    logServer("fatal", "Falha crítica")
    expect(errorSpy).toHaveBeenCalledTimes(2)
  })

  it("omite campos vazios/undefined do JSON final", () => {
    logServer("info", "Evento", { requestId: "req_1", correlationId: undefined, userId: "" })
    const parsed = JSON.parse(logSpy.mock.calls[0][0] as string)
    expect("correlationId" in parsed).toBe(false)
    expect("userId" in parsed).toBe(false)
  })

  it("sanitiza campos sensíveis passados como fields extras", () => {
    logServer("error", "Falha na Admin API", { errorCode: "x", token: "secret-value" } as any)
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.token).toBe("[REDACTED]")
  })
})

describe("generateRequestId", () => {
  it("gera ids com o prefixo esperado e não repete entre chamadas", () => {
    const a = generateRequestId()
    const b = generateRequestId()
    expect(a).toMatch(/^req_/)
    expect(a).not.toBe(b)
  })
})

describe("logClientError", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it("extrai só message/code do erro — nunca propaga o objeto de erro inteiro", () => {
    const error = {
      message: "Credenciais inválidas",
      code: "invalid_credentials",
      password: "hunter2", // nunca deveria existir aqui, mas se existir não pode vazar
      originalError: { stack: "...", authorizationHeader: "Bearer abc" },
    }
    logClientError("auth.login", error)
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.error.message).toBe("Credenciais inválidas")
    expect(parsed.error.code).toBe("invalid_credentials")
    expect(JSON.stringify(parsed)).not.toContain("hunter2")
    expect(JSON.stringify(parsed)).not.toContain("Bearer abc")
    expect(parsed.error.originalError).toBeUndefined()
  })

  it("sanitiza o contexto extra passado", () => {
    logClientError("service.error", new Error("falhou"), { userId: "u1", token: "should-not-appear" })
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string)
    expect(parsed.userId).toBe("u1")
    expect(parsed.token).toBe("[REDACTED]")
  })

  it("produz sempre JSON válido, mesmo com erro não-objeto", () => {
    logClientError("x", "erro em texto puro")
    expect(() => JSON.parse(errorSpy.mock.calls[0][0] as string)).not.toThrow()
  })
})

describe("logClientDebug", () => {
  let logSpy: ReturnType<typeof vi.spyOn>
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error NODE_ENV é readonly no tipo, mas settable em runtime de teste
    process.env.NODE_ENV = originalEnv
  })

  it("não loga nada em produção", () => {
    // @ts-expect-error idem
    process.env.NODE_ENV = "production"
    logClientDebug("auth.supabase_event", { eventName: "SIGNED_IN" })
    expect(logSpy).not.toHaveBeenCalled()
  })

  it("loga em desenvolvimento", () => {
    // @ts-expect-error idem
    process.env.NODE_ENV = "development"
    logClientDebug("auth.supabase_event", { eventName: "SIGNED_IN" })
    expect(logSpy).toHaveBeenCalledOnce()
  })
})
