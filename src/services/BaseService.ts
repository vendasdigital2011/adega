import { supabase } from "@/lib/supabase"
import { logClientError } from "@/lib/logger"

export abstract class BaseService {
  protected supabase = supabase

  protected isOfflineOrDemoMode(error?: unknown): boolean {
    if (error && typeof error === "object") {
      const msg = String((error as any).message || "").toLowerCase()
      const code = String((error as any).code || "")
      const isNetworkError = msg.includes("fetch") || msg.includes("failed") || msg.includes("network") || msg.includes("err_")
      if (code && !isNetworkError) return false
    }

    const isBypass = process.env.NEXT_PUBLIC_BYPASS_MIDDLEWARE === "true"
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasDemoUser = typeof window !== "undefined" && !!localStorage.getItem("adega_demo_user")
    return Boolean(isBypass || isPlaceholder || hasDemoUser)
  }

  protected getLocalMockStore<T>(key: string, initialData: T[]): T[] {
    if (typeof window === "undefined") return initialData
    const stored = localStorage.getItem(`adega_mock_${key}`)
    if (!stored) {
      localStorage.setItem(`adega_mock_${key}`, JSON.stringify(initialData))
      return initialData
    }
    try {
      return JSON.parse(stored) as T[]
    } catch {
      return initialData
    }
  }

  protected saveLocalMockStore<T>(key: string, data: T[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(`adega_mock_${key}`, JSON.stringify(data))
    }
  }

  protected handleError(error: unknown, action: string = "service.error"): never {
    const isErrorLike = (e: unknown): e is { message?: string; code?: string } =>
      typeof e === "object" && e !== null

    const message = (isErrorLike(error) && error.message) || "Ocorreu um erro inesperado."
    const code = (isErrorLike(error) && error.code) || "UNKNOWN_ERROR"
    logClientError(action, error, { errorCode: code })

    throw {
      message,
      code,
      originalError: error,
    }
  }

  // Resolves the company_id of the currently authenticated user.
  protected async getCurrentUserCompanyId(): Promise<string> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("adega_demo_user")
      if (stored && stored.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed && parsed.company_id) return parsed.company_id as string
        } catch (e) {}
      }
    }

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (user) {
        const { data: profile, error } = await this.supabase
          .from("users")
          .select("company_id")
          .eq("id", user.id)
          .single()

        if (!error && profile?.company_id) {
          return profile.company_id as string
        }
      }
    } catch (e) {}

    // Fallback de desenvolvimento local e demonstração
    return "c1111111-1111-1111-1111-111111111111"
  }

  // Resolves the user_id of the currently authenticated user.
  protected async getCurrentUserId(): Promise<string> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("adega_demo_user")
      if (stored && stored.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed && parsed.id) return parsed.id as string
        } catch (e) {}
      }
    }

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()

      if (user) {
        return user.id
      }
    } catch (e) {}

    // Fallback de desenvolvimento local e demonstração
    return "00000000-0000-0000-0000-000000000001"
  }

  // Common audit log helper
  protected async createAuditLog(
    companyId: string,
    userId: string,
    action: string,
    tableName: string,
    recordId: string,
    oldData: object | null = null,
    newData: object | null = null
  ) {
    try {
      const { error } = await this.supabase.from("audit_logs").insert({
        company_id: companyId,
        user_id: userId,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
        ip: "127.0.0.1", // Simplified placeholder for frontend logs
      })

      if (error) {
        logClientError("audit.write_failed", error, { tenantId: companyId, action, module: tableName })
      }
    } catch (e) {
      logClientError("audit.create_exception", e, { tenantId: companyId, action, module: tableName })
    }
  }

  // Convenience wrapper: audits an action performed by the currently authenticated user.
  protected async auditAsCurrentUser(
    action: string,
    tableName: string,
    recordId: string,
    oldData: object | null = null,
    newData: object | null = null
  ) {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) return

      const companyId = await this.getCurrentUserCompanyId()
      await this.createAuditLog(companyId, user.id, action, tableName, recordId, oldData, newData)
    } catch (e) {
      logClientError("audit.current_user_action_failed", e, { action, module: tableName })
    }
  }
}
