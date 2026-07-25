import { BaseService } from "./BaseService"
import { Customer } from "@/types"

export interface CreateCustomerInput {
  name: string
  document?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  birthday?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
  credit_limit?: number | null
}

export type UpdateCustomerInput = Partial<CreateCustomerInput> & { active?: boolean }

export interface ListCustomersOptions {
  search?: string
  active?: boolean
  page: number
  limit: number
}

export interface ListCustomersResult {
  data: Customer[]
  total: number
}

export class CustomerService extends BaseService {
  private static instance: CustomerService

  private constructor() {
    super()
  }

  public static getInstance(): CustomerService {
    if (!CustomerService.instance) {
      CustomerService.instance = new CustomerService()
    }
    return CustomerService.instance
  }

  public async list(options: ListCustomersOptions): Promise<ListCustomersResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("customers")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to)

      if (options.search) {
        query = query.or(
          `name.ilike.%${options.search}%,document.ilike.%${options.search}%,phone.ilike.%${options.search}%,whatsapp.ilike.%${options.search}%`
        )
      }
      if (typeof options.active === "boolean") {
        query = query.eq("active", options.active)
      }

      const { data, error, count } = await query
      if (error) throw error

      return { data: (data as Customer[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateCustomerInput): Promise<Customer> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("customers")
        .insert({ company_id: companyId, ...this.normalize(input) })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "customers", data.id, null, input)
      return data as Customer
    } catch (error) {
      this.handleDuplicateDocument(error)
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateCustomerInput): Promise<Customer> {
    try {
      const { data, error } = await this.supabase
        .from("customers")
        .update(this.normalize(input))
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "customers", id, null, input)
      return data as Customer
    } catch (error) {
      this.handleDuplicateDocument(error)
      this.handleError(error)
    }
  }

  public async setActive(id: string, active: boolean): Promise<Customer> {
    return this.update(id, { active })
  }

  // Campos opcionais vazios viram null (importante para o documento: o índice
  // único parcial só age sobre documentos não-nulos).
  private normalize<T extends object>(input: T): T {
    const out = { ...(input as Record<string, unknown>) }
    for (const key of ["document", "email", "phone", "whatsapp", "birthday", "address", "city", "state", "notes", "credit_limit"]) {
      if (key in out && (out[key] === "" || out[key] === undefined)) {
        out[key] = null
      }
    }
    return out as T
  }

  private handleDuplicateDocument(error: unknown): void {
    if ((error as { code?: string })?.code === "23505") {
      this.handleError({ message: "Já existe um cliente com esse documento.", code: "DUPLICATE_DOCUMENT" })
    }
  }
}

export const customerService = CustomerService.getInstance()
