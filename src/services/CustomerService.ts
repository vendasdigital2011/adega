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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Customer[] = [
          {
            id: "cust-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "João Silva",
            document: "123.456.789-00",
            email: "joao.silva@email.com",
            phone: "(11) 98765-4321",
            whatsapp: "(11) 98765-4321",
            birthday: "1985-05-15",
            address: "Rua das Flores, 123",
            city: "São Paulo",
            state: "SP",
            notes: "Cliente VIP, prefere vinhos secos",
            credit_limit: 1000.00,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "cust-2",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Maria Oliveira",
            document: "987.654.321-11",
            email: "maria.oliveira@email.com",
            phone: "(11) 91234-5678",
            whatsapp: "(11) 91234-5678",
            birthday: "1990-10-20",
            address: "Av. Paulista, 1000",
            city: "São Paulo",
            state: "SP",
            notes: "Comprador semanal de cervejas artesanais",
            credit_limit: 500.00,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        let items = this.getLocalMockStore("customers", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter(
            (c) =>
              c.name.toLowerCase().includes(term) ||
              (c.document && c.document.includes(term)) ||
              (c.phone && c.phone.includes(term))
          )
        }
        if (typeof options.active === "boolean") {
          items = items.filter((c) => c.active === options.active)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "customers.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Customer[] = [
          {
            id: "cust-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "João Silva",
            document: "123.456.789-00",
            email: "joao.silva@email.com",
            phone: "(11) 98765-4321",
            whatsapp: "(11) 98765-4321",
            birthday: "1985-05-15",
            address: "Rua das Flores, 123",
            city: "São Paulo",
            state: "SP",
            notes: "Cliente VIP, prefere vinhos secos",
            credit_limit: 1000.00,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("customers", initialMock)
        const newCust: Customer = {
          id: `cust-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name,
          document: input.document || null,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
          email: input.email || null,
          birthday: input.birthday || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          notes: input.notes || null,
          credit_limit: input.credit_limit || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newCust)
        this.saveLocalMockStore("customers", list)
        return newCust
      }
      this.handleError(error, "customers.create")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Customer[] = [
          {
            id: "cust-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "João Silva",
            document: "123.456.789-00",
            email: "joao.silva@email.com",
            phone: "(11) 98765-4321",
            whatsapp: "(11) 98765-4321",
            birthday: "1985-05-15",
            address: "Rua das Flores, 123",
            city: "São Paulo",
            state: "SP",
            notes: "Cliente VIP, prefere vinhos secos",
            credit_limit: 1000.00,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("customers", initialMock)
        const idx = list.findIndex((c) => c.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("customers", list)
          return list[idx]
        }
        const updatedCust: Customer = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Cliente Atualizado",
          document: input.document || null,
          email: input.email || null,
          phone: input.phone || null,
          whatsapp: input.whatsapp || null,
          birthday: input.birthday || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          notes: input.notes || null,
          credit_limit: input.credit_limit || null,
          active: typeof input.active === "boolean" ? input.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedCust)
        this.saveLocalMockStore("customers", list)
        return updatedCust
      }
      this.handleError(error, "customers.update")
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
