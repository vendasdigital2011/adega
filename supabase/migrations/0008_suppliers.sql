-- Adega Cloud — Sprint 07: Fornecedores
-- Tabela de fornecedores, multi-tenant, documento (CPF/CNPJ) único por empresa,
-- exclusão lógica (active) e RLS orientada às permissões suppliers.*.
-- As permissões suppliers.* já foram semeadas em 0004.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  document text not null,
  email text,
  phone text,
  address text,
  city text,
  state text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_suppliers_company_id on public.suppliers(company_id);

-- Documento único por empresa (regra de negócio: "Não será permitido duplicar documento")
alter table public.suppliers drop constraint if exists suppliers_document_company_unique;
alter table public.suppliers add constraint suppliers_document_company_unique unique (company_id, document);

drop trigger if exists trg_suppliers_updated_at on public.suppliers;
create trigger trg_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table public.suppliers enable row level security;

drop policy if exists "suppliers_select_same_company" on public.suppliers;
create policy "suppliers_select_same_company" on public.suppliers
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('suppliers.view')
  );

drop policy if exists "suppliers_insert_with_permission" on public.suppliers;
create policy "suppliers_insert_with_permission" on public.suppliers
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('suppliers.create')
  );

-- Edição inclui exclusão lógica (active). Não há permissão suppliers.delete no
-- catálogo, então inativar é tratado como edição.
drop policy if exists "suppliers_update_with_permission" on public.suppliers;
create policy "suppliers_update_with_permission" on public.suppliers
  for update using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('suppliers.edit')
  );
