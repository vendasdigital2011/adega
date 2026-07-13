import { Badge } from "@/components/ui/Badge"
import { PurchaseStatus } from "@/types"

const config: Record<PurchaseStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  recebida: { label: "Recebida", variant: "success" },
  cancelada: { label: "Cancelada", variant: "destructive" },
}

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const c = config[status]
  return <Badge variant={c.variant}>{c.label}</Badge>
}
