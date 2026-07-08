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
