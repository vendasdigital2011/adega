import { describe, it, expect, vi, beforeEach } from "vitest"
import { CacheKeys } from "@/services/cache/CacheKeys"
import { CACHE_TTL } from "@/services/cache/CacheTTL"
import { CacheService } from "@/services/cache/CacheService"

describe("Cache Architecture & Resiliency", () => {
  it("gerador de CacheKeys constrói chaves formatadas isoladas por empresa", () => {
    const companyId = "c123456"
    expect(CacheKeys.dashboard(companyId)).toBe("company:c123456:dashboard")
    expect(CacheKeys.categories(companyId)).toBe("company:c123456:categories")
    expect(CacheKeys.brands(companyId)).toBe("company:c123456:brands")
    expect(CacheKeys.productsList(companyId)).toBe("company:c123456:products:list:all")
    expect(CacheKeys.settings(companyId)).toBe("company:c123456:settings")
    expect(CacheKeys.patterns.products(companyId)).toBe("company:c123456:products:*")
  })

  it("CacheTTL define corretamente os tempos de vida em segundos conforme PDR-011", () => {
    expect(CACHE_TTL.DASHBOARD).toBe(60)
    expect(CACHE_TTL.PRODUCTS).toBe(120)
    expect(CACHE_TTL.CATEGORIES).toBe(900)
    expect(CACHE_TTL.BRANDS).toBe(900)
    expect(CACHE_TTL.SETTINGS).toBe(1800)
    expect(CACHE_TTL.PERMISSIONS).toBe(300)
    expect(CACHE_TTL.REPORTS).toBe(600)
  })

  it("CacheService retorna null / bypass seguro quando Redis não está configurado em dev", async () => {
    const cache = CacheService.getInstance()
    const result = await cache.get("company:test:dashboard")
    expect(result).toBeNull()
  })

  it("CacheService não dispara exceções não tratadas ao tentar set/delete sem Redis", async () => {
    const cache = CacheService.getInstance()
    await expect(cache.set("company:test:key", { data: 123 }, 60)).resolves.not.toThrow()
    await expect(cache.invalidate("company:test:key")).resolves.not.toThrow()
    await expect(cache.invalidatePattern("company:test:*")).resolves.not.toThrow()
  })
})
