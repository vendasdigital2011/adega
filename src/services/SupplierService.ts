import { BaseService } from "./BaseService"
import { Supplier } from "@/types"

export interface CreateSupplierInput {
  name: string
  document: string
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  notes?: string | null
}

export type UpdateSupplierInput = Partial<CreateSupplierInput> & { active?: boolean }

export interface ListSuppliersOptions {
  search?: string
  active?: boolean
  page: number
  limit: number
}

export interface ListSuppliersResult {
  data: Supplier[]
  total: number
}

export class SupplierService extends BaseService {
  private static instance: SupplierService

  private constructor() {
    super()
  }

  public static getInstance(): SupplierService {
    if (!SupplierService.instance) {
      SupplierService.instance = new SupplierService()
    }
    return SupplierService.instance
  }

  public async list(options: ListSuppliersOptions): Promise<ListSuppliersResult> {
    try {
      const from = (options.page - 1) * options.limit
      const to = from + options.limit - 1

      let query = this.supabase
        .from("suppliers")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(from, to)

      if (options.search) {
        query = query.or(
          `name.ilike.%${options.search}%,document.ilike.%${options.search}%,phone.ilike.%${options.search}%`
        )
      }
      if (typeof options.active === "boolean") {
        query = query.eq("active", options.active)
      }

      const { data, error, count } = await query
      if (error) throw error

      return { data: (data as Supplier[]) || [], total: count || 0 }
    } catch (error) {
      this.handleError(error)
    }
  }

  public async create(input: CreateSupplierInput): Promise<Supplier> {
    try {
      const companyId = await this.getCurrentUserCompanyId()
      const { data, error } = await this.supabase
        .from("suppliers")
        .insert({ company_id: companyId, ...this.normalize(input) })
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("INSERT", "suppliers", data.id, null, input)
      return data as Supplier
    } catch (error) {
      this.handleDuplicateDocument(error)
      this.handleError(error)
    }
  }

  public async update(id: string, input: UpdateSupplierInput): Promise<Supplier> {
    try {
      const { data, error } = await this.supabase
        .from("suppliers")
        .update(this.normalize(input))
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      await this.auditAsCurrentUser("UPDATE", "suppliers", id, null, input)
      return data as Supplier
    } catch (error) {
      this.handleDuplicateDocument(error)
      this.handleError(error)
    }
  }

  public async setActive(id: string, active: boolean): Promise<Supplier> {
    return this.update(id, { active })
  }

  // Converte strings vazias dos campos opcionais em null antes de persistir.
  private normalize<T extends object>(input: T): T {
    const out = { ...(input as Record<string, unknown>) }
    for (const key of ["email", "phone", "address", "city", "state", "notes"]) {
      if (key in out && (out[key] === "" || out[key] === undefined)) {
        out[key] = null
      }
    }
    return out as T
  }

  private handleDuplicateDocument(error: unknown): void {
    if ((error as { code?: string })?.code === "23505") {
      this.handleError({ message: "Já existe um fornecedor com esse documento.", code: "DUPLICATE_DOCUMENT" })
    }
  }
}

export const supplierService = SupplierService.getInstance()
