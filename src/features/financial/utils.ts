import { AccountsPayableStatus, AccountsReceivableStatus } from "@/types"

type BadgeVariant = "success" | "warning" | "destructive" | "secondary" | "default"

// Vencida não é um status gravado no banco — é calculado na leitura: uma
// conta Aberta/Parcial cujo vencimento já passou.
export function displayStatus(
  status: AccountsReceivableStatus | AccountsPayableStatus,
  dueDate: string,
  settledLabel: string
): { label: string; variant: BadgeVariant } {
  if (status === settledLabel) return { label: settledLabel, variant: "success" }
  if (status === "Cancelada") return { label: "Cancelada", variant: "secondary" }
  const isOverdue = new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10))
  if (isOverdue) return { label: "Vencida", variant: "destructive" }
  if (status === "Parcial") return { label: "Parcial", variant: "warning" }
  return { label: "Aberta", variant: "default" }
}
