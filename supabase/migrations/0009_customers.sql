-- Adega Cloud — Sprint 08: Clientes
-- Tabela de clientes, multi-tenant. Apenas o nome é obrigatório; o documento é
-- opcional, mas único por empresa QUANDO informado (índice único parcial).
-- Exclusão lógica (active) e RLS orientada às permissões customers.*.
-- As permissões customers.* já foram semeadas em 0004.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  document text,
  email text,
  phone text,
  whatsapp text,
  birthday date,
  address text,
  city text,
  state text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_company_id on public.customers(company_id);

-- Documento único por empresa APENAS quando informado
-- (regra: "Caso exista documento informado, ele deverá ser único").
drop index if exists public.idx_customers_document_unique;
create unique index idx_customers_document_unique
  on public.customers (company_id, document)
  where document is not null;

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table public.customers enable row level security;

drop policy if exists "customers_select_same_company" on public.customers;
create policy "customers_select_same_company" on public.customers
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('customers.view')
  );

drop policy if exists "customers_insert_with_permission" on public.customers;
create policy "customers_insert_with_permission" on public.customers
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('customers.create')
  );

-- Edição inclui exclusão lógica (active). Não há permissão customers.delete no
-- catálogo, então inativar é tratado como edição.
drop policy if exists "customers_update_with_permission" on public.customers;
create policy "customers_update_with_permission" on public.customers
  for update using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('customers.edit')
  );
