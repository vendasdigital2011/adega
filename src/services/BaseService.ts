import { supabase } from "@/lib/supabase"
import { logClientError } from "@/lib/logger"

export abstract class BaseService {
  protected supabase = supabase

  protected handleError(error: unknown): never {
    const isErrorLike = (e: unknown): e is { message?: string; code?: string } =>
      typeof e === "object" && e !== null

    const message = (isErrorLike(error) && error.message) || "Ocorreu um erro inesperado."
    const code = (isErrorLike(error) && error.code) || "UNKNOWN_ERROR"
    logClientError("service.error", error, { errorCode: code })

    throw {
      message,
      code,
      originalError: error,
    }
  }

  // Resolves the company_id of the currently authenticated user.
  protected async getCurrentUserCompanyId(): Promise<string> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    if (!user) throw { message: "Usuário não autenticado.", code: "UNAUTHENTICATED" }

    const { data: profile, error } = await this.supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single()

    if (error || !profile) throw { message: "Não foi possível identificar a empresa do usuário.", code: "UNKNOWN_ERROR" }
    return profile.company_id as string
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
