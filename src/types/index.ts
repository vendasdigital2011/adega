export interface Company {
  id: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  company_id: string
  name: string
  description: string | null
}

export interface Permission {
  id: string
  name: string
  description: string | null
}

export interface Category {
  id: string
  company_id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  company_id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  company_id: string
  name: string
  document: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  company_id: string
  name: string
  document: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  birthday: string | null
  address: string | null
  city: string | null
  state: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  company_id: string
  category_id: string
  brand_id: string | null
  supplier_id: string | null
  name: string
  sku: string
  barcode: string | null
  description: string | null
  unit: string | null
  purchase_price: number | null
  sale_price: number
  wholesale_price: number | null
  promotion_price: number | null
  minimum_stock: number
  current_stock: number
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
  // Loaded relationships
  category?: { name: string } | null
  brand?: { name: string } | null
}

export type MovementType =
  | "Entrada"
  | "Saída"
  | "Venda"
  | "Compra"
  | "Ajuste"
  | "Inventário"
  | "Perda"
  | "Quebra"

export interface InventoryMovement {
  id: string
  company_id: string
  product_id: string
  movement_type: MovementType
  quantity: number
  previous_quantity: number
  current_quantity: number
  reference: string | null
  observation: string | null
  user_id: string | null
  created_at: string
  // Loaded relationships
  product?: { name: string; sku: string } | null
}

export type PurchaseStatus = "pendente" | "recebida" | "cancelada"

export interface PurchaseItem {
  id: string
  purchase_id: string
  product_id: string
  quantity: number
  unit_price: number
  total: number
  // Loaded relationship
  product?: { name: string; sku: string } | null
}

export interface Purchase {
  id: string
  company_id: string
  supplier_id: string
  purchase_date: string
  freight: number
  discount: number
  total: number
  status: PurchaseStatus
  notes: string | null
  created_by: string | null
  created_at: string
  // Loaded relationships
  supplier?: { name: string } | null
  items?: PurchaseItem[]
}

export type UserStatus = "active" | "inactive" | "blocked"

export interface User {
  id: string
  company_id: string
  role_id: string
  name: string
  email: string
  phone: string | null
  status: UserStatus
  last_login: string | null
  created_at: string
  updated_at: string
  // Loaded relationships
  company?: Company
  role?: Role
  permissions?: Permission[]
}

export interface ApiResponse<T> {
  data: T | null
  error: {
    message: string
    code?: string
  } | null
  status: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AuditLogInput {
  table_name: string
  record_id: string
  action: "INSERT" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "PASSWORD_RESET" | "PASSWORD_CHANGE"
  old_data?: Record<string, any> | null
  new_data?: Record<string, any> | null
  observation?: string
}
