type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info"

// Ações gravadas na coluna action de audit_logs (INSERT/UPDATE por
// BaseService, LOGIN/LOGOUT/PASSWORD_CHANGE por AuthService). Sub-ações como
// "cancel"/"receive"/"receipt"/"payment" ficam em new_data, não aqui.
export const AUDIT_ACTIONS: { value: string; label: string }[] = [
  { value: "INSERT", label: "Inclusão" },
  { value: "UPDATE", label: "Alteração" },
  { value: "DELETE", label: "Exclusão" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "PASSWORD_CHANGE", label: "Troca de senha" },
  { value: "PASSWORD_RESET", label: "Reset de senha" },
]

const ACTION_META: Record<string, { label: string; variant: BadgeVariant }> = {
  INSERT: { label: "Inclusão", variant: "success" },
  UPDATE: { label: "Alteração", variant: "warning" },
  DELETE: { label: "Exclusão", variant: "destructive" },
  LOGIN: { label: "Login", variant: "info" },
  LOGOUT: { label: "Logout", variant: "secondary" },
  PASSWORD_CHANGE: { label: "Troca de senha", variant: "default" },
  PASSWORD_RESET: { label: "Reset de senha", variant: "default" },
}

export function actionLabel(action: string): { label: string; variant: BadgeVariant } {
  return ACTION_META[action] || { label: action, variant: "secondary" }
}

// Tabelas auditadas → nome amigável do módulo. Alimenta o filtro e a coluna
// "Módulo" da tabela de auditoria.
export const AUDIT_TABLES: { value: string; label: string }[] = [
  { value: "users", label: "Usuários" },
  { value: "roles", label: "Perfis" },
  { value: "role_permissions", label: "Permissões" },
  { value: "categories", label: "Categorias" },
  { value: "brands", label: "Marcas" },
  { value: "suppliers", label: "Fornecedores" },
  { value: "customers", label: "Clientes" },
  { value: "products", label: "Produtos" },
  { value: "inventory_movements", label: "Estoque" },
  { value: "purchases", label: "Compras" },
  { value: "sales", label: "Vendas" },
  { value: "cash_registers", label: "Caixa" },
  { value: "cash_movements", label: "Movimentações de caixa" },
  { value: "accounts_receivable", label: "Contas a receber" },
  { value: "accounts_payable", label: "Contas a pagar" },
  { value: "cost_centers", label: "Centros de custo" },
  { value: "companies", label: "Empresa" },
  { value: "settings", label: "Configurações" },
]

const TABLE_LABELS: Record<string, string> = Object.fromEntries(
  AUDIT_TABLES.map((t) => [t.value, t.label])
)

export function tableLabel(tableName: string): string {
  return TABLE_LABELS[tableName] || tableName
}
