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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Supplier[] = [
          {
            id: "sup-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Vinícola Aurora Ltda",
            document: "12.345.678/0001-90",
            email: "contato@aurora.com.br",
            phone: "(54) 3455-1000",
            address: "Rua Olavo Bilac, 500",
            city: "Bento Gonçalves",
            state: "RS",
            notes: "Fornecedor principal de vinhos",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "sup-2",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Distribuidora Ambev",
            document: "98.765.432/0001-10",
            email: "vendas@ambev.com.br",
            phone: "(11) 4004-0000",
            address: "Av. Industrial, 1000",
            city: "São Paulo",
            state: "SP",
            notes: "Fornecedor de cervejas e refrigerantes",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        let items = this.getLocalMockStore("suppliers", initialMock)
        if (options.search) {
          const term = options.search.toLowerCase()
          items = items.filter(
            (s) =>
              s.name.toLowerCase().includes(term) ||
              (s.document && s.document.includes(term)) ||
              (s.phone && s.phone.includes(term))
          )
        }
        if (typeof options.active === "boolean") {
          items = items.filter((s) => s.active === options.active)
        }
        return { data: items, total: items.length }
      }
      this.handleError(error, "suppliers.list")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Supplier[] = [
          {
            id: "sup-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Vinícola Aurora Ltda",
            document: "12.345.678/0001-90",
            email: "contato@aurora.com.br",
            phone: "(54) 3455-1000",
            address: "Rua Olavo Bilac, 500",
            city: "Bento Gonçalves",
            state: "RS",
            notes: "Fornecedor principal de vinhos",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("suppliers", initialMock)
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name,
          document: input.document,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          notes: input.notes || null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(newSup)
        this.saveLocalMockStore("suppliers", list)
        return newSup
      }
      this.handleError(error, "suppliers.create")
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
      if (this.isOfflineOrDemoMode(error)) {
        const initialMock: Supplier[] = [
          {
            id: "sup-1",
            company_id: "c1111111-1111-1111-1111-111111111111",
            name: "Vinícola Aurora Ltda",
            document: "12.345.678/0001-90",
            email: "contato@aurora.com.br",
            phone: "(54) 3455-1000",
            address: "Rua Olavo Bilac, 500",
            city: "Bento Gonçalves",
            state: "RS",
            notes: "Fornecedor principal de vinhos",
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]
        const list = this.getLocalMockStore("suppliers", initialMock)
        const idx = list.findIndex((s) => s.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...input, updated_at: new Date().toISOString() }
          this.saveLocalMockStore("suppliers", list)
          return list[idx]
        }
        const updatedSup: Supplier = {
          id,
          company_id: "c1111111-1111-1111-1111-111111111111",
          name: input.name || "Fornecedor Atualizado",
          document: input.document || "00.000.000/0000-00",
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          notes: input.notes || null,
          active: typeof input.active === "boolean" ? input.active : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        list.unshift(updatedSup)
        this.saveLocalMockStore("suppliers", list)
        return updatedSup
      }
      this.handleError(error, "suppliers.update")
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
