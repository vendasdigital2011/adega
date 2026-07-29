import { describe, it, expect, vi } from "vitest"
import { redact, maskPiiValue, generateRequestId, logServer, logClientError } from "@/lib/logger"

describe("Logger & Sanitization Unit Tests", () => {
  it("redacts sensitive authentication keys and secrets", () => {
    const input = {
      password: "secret_password_123",
      token: "bearer_abc_123",
      apiKey: "key_xyz_890",
      authorization: "Bearer token_xxx",
      user: {
        access_token: "secret_access_token",
      },
    }

    const output = redact(input) as Record<string, any>

    expect(output.password).toBe("[REDACTED]")
    expect(output.token).toBe("[REDACTED]")
    expect(output.apiKey).toBe("[REDACTED]")
    expect(output.authorization).toBe("[REDACTED]")
    expect(output.user.access_token).toBe("[REDACTED]")
  })

  it("masks PII fields (LGPD) correctly", () => {
    expect(maskPiiValue("usuario@dominio.com")).toBe("us***@dominio.com")
    expect(maskPiiValue("12345678901")).toBe("***.***.789-01")
    expect(maskPiiValue("12345678000190")).toBe("**.***.***/0001-90")
    expect(maskPiiValue("11987654321", "telefone")).toBe("(**) *****-4321")

    const payload = {
      email: "cliente@adega.com",
      cpf: "98765432100",
      telefone: "11912345678",
      normalField: "vinho tinto",
    }

    const sanitized = redact(payload) as Record<string, any>

    expect(sanitized.email).toBe("cl***@adega.com")
    expect(sanitized.cpf).toBe("***.***.321-00")
    expect(sanitized.telefone).toBe("(**) *****-5678")
    expect(sanitized.normalField).toBe("vinho tinto")
  })

  it("sanitizes arrays and nested structures recursively", () => {
    const complexObj = {
      items: [
        { product: "Vinho Merlot", price: 50 },
        { password: "123", email: "teste@teste.com" },
      ],
    }

    const sanitized = redact(complexObj) as Record<string, any>

    expect(sanitized.items[0].product).toBe("Vinho Merlot")
    expect(sanitized.items[1].password).toBe("[REDACTED]")
    expect(sanitized.items[1].email).toBe("te***@teste.com")
  })

  it("generates unique request IDs", () => {
    const reqId1 = generateRequestId()
    const reqId2 = generateRequestId()

    expect(reqId1).toMatch(/^req_/)
    expect(reqId2).toMatch(/^req_/)
    expect(reqId1).not.toBe(reqId2)
  })

  it("outputs structured JSON logs without throwing exceptions", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    logClientError("test.action", new Error("Test failure"), { email: "usuario@teste.com" })

    expect(consoleSpy).toHaveBeenCalledOnce()
    const logCallArg = consoleSpy.mock.calls[0][0]
    const parsed = JSON.parse(logCallArg)

    expect(parsed.service).toBe("adega-cloud-web")
    expect(parsed.action).toBe("test.action")
    expect(parsed.email).toBe("us***@teste.com")

    consoleSpy.mockRestore()
  })
})
