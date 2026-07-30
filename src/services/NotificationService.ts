import { BaseService } from "./BaseService"
import { Notification } from "@/types"

// Alertas do sistema (Sprint 18). generate() chama o RPC SECURITY DEFINER que
// varre estoque baixo / contas vencidas / caixa aberto e grava só o que ainda
// não existe como não-lido (idempotente — seguro chamar a cada poll). RLS
// filtra o que list() retorna conforme a permissão do usuário para cada tipo.
export class NotificationService extends BaseService {
  private static instance: NotificationService

  private constructor() {
    super()
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public async generate(): Promise<void> {
    if (this.isOfflineOrDemoMode()) return
    try {
      const { error } = await this.supabase.rpc("generate_notifications")
      if (error) throw error
    } catch (e) {}
  }

  public async list(limit = 15): Promise<Notification[]> {
    if (this.isOfflineOrDemoMode()) return []
    try {
      const { data, error } = await this.supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data as Notification[]) || []
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) return []
      this.handleError(error)
    }
  }

  public async unreadCount(): Promise<number> {
    if (this.isOfflineOrDemoMode()) return 0
    try {
      const { count, error } = await this.supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false)

      if (error) throw error
      return count || 0
    } catch (error) {
      if (this.isOfflineOrDemoMode(error)) return 0
      this.handleError(error)
    }
  }

  public async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase.from("notifications").update({ read: true }).eq("id", id)
    if (error) throw error
  }

  public async markAllAsRead(): Promise<void> {
    const { error } = await this.supabase.from("notifications").update({ read: true }).eq("read", false)
    if (error) throw error
  }
}

export const notificationService = NotificationService.getInstance()
