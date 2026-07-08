import { Badge } from "@/components/ui/Badge"
import { UserStatus } from "@/types"

const statusConfig: Record<UserStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  active: { label: "Ativo", variant: "success" },
  inactive: { label: "Inativo", variant: "secondary" },
  blocked: { label: "Bloqueado", variant: "destructive" },
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
