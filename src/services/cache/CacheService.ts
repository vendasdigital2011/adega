import { BaseService } from "../BaseService"
import { redis, isRedisConfigured } from "@/lib/redis"
import { logClientDebug, logClientError } from "@/lib/logger"

export class CacheService extends BaseService {
  private static instance: CacheService

  private constructor() {
    super()
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  /**
   * Obtém um item do cache Redis. Retorna null se não encontrado ou se o Redis estiver indisponível.
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!isRedisConfigured || !redis) {
      return null
    }

    try {
      const data = await redis.get<T>(key)
      if (data !== null && data !== undefined) {
        logClientDebug("cache.hit", { key })
        return data
      }
      logClientDebug("cache.miss", { key })
      return null
    } catch (error) {
      logClientError("cache.get_error", error, { key })
      return null
    }
  }

  /**
   * Salva um item no cache Redis com TTL opcional em segundos.
   */
  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!isRedisConfigured || !redis) {
      return
    }

    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.set(key, value, { ex: ttlSeconds })
      } else {
        await redis.set(key, value)
      }
      logClientDebug("cache.set_success", { key, ttlSeconds })
    } catch (error) {
      logClientError("cache.set_error", error, { key })
    }
  }

  /**
   * Remove uma chave específica do cache.
   */
  public async delete(key: string): Promise<void> {
    if (!isRedisConfigured || !redis) {
      return
    }

    try {
      await redis.del(key)
      logClientDebug("cache.delete_success", { key })
    } catch (error) {
      logClientError("cache.delete_error", error, { key })
    }
  }

  /**
   * Verifica se uma chave existe no cache.
   */
  public async exists(key: string): Promise<boolean> {
    if (!isRedisConfigured || !redis) {
      return false
    }

    try {
      const res = await redis.exists(key)
      return res > 0
    } catch (error) {
      logClientError("cache.exists_error", error, { key })
      return false
    }
  }

  /**
   * Invalida uma chave específica de cache.
   */
  public async invalidate(key: string): Promise<void> {
    await this.delete(key)
  }

  /**
   * Invalida múltiplas chaves por padrão glob (ex: company:123:*).
   */
  public async invalidatePattern(pattern: string): Promise<void> {
    if (!isRedisConfigured || !redis) {
      return
    }

    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        logClientDebug("cache.invalidate_pattern_success", { pattern, keysCount: keys.length })
      }
    } catch (error) {
      logClientError("cache.invalidate_pattern_error", error, { pattern })
    }
  }
}

export const cacheService = CacheService.getInstance()
