import { supabase } from "@/lib/supabase"

export abstract class BaseService {
  protected supabase = supabase

  protected handleError(error: unknown): never {
    const isErrorLike = (e: unknown): e is { message?: string; code?: string } =>
      typeof e === "object" && e !== null

    const message = (isErrorLike(error) && error.message) || "Ocorreu um erro inesperado."
    const code = (isErrorLike(error) && error.code) || "UNKNOWN_ERROR"
    console.error(`[BaseService Error] Code: ${code}, Message: ${message}`, error)

    throw {
      message,
      code,
      originalError: error,
    }
  }

  // Common audit log helper
  protected async createAuditLog(
    companyId: string,
    userId: string,
    action: string,
    tableName: string,
    recordId: string,
    oldData: Record<string, unknown> | null = null,
    newData: Record<string, unknown> | null = null
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
        console.error("Failed to write audit log:", error)
      }
    } catch (e) {
      console.error("Failed to create audit log:", e)
    }
  }
}
