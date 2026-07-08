-- Adega Cloud — Sprint 05: Categorias
-- Tabela de categorias de produtos, multi-tenant, com nome único por empresa,
-- exclusão lógica (active) e RLS orientada às permissões categories.*.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_company_id on public.categories(company_id);

-- Nome único por empresa (regra de negócio: "Nome único")
alter table public.categories drop constraint if exists categories_name_company_unique;
alter table public.categories add constraint categories_name_company_unique unique (company_id, name);

-- updated_at automático (função já criada em 0001)
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table public.categories enable row level security;

-- Leitura: apenas categorias da própria empresa (e com permissão de ver)
drop policy if exists "categories_select_same_company" on public.categories;
create policy "categories_select_same_company" on public.categories
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('categories.view')
  );

-- Criação: própria empresa + permissão de criar
drop policy if exists "categories_insert_with_permission" on public.categories;
create policy "categories_insert_with_permission" on public.categories
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('categories.create')
  );

-- Edição (inclui exclusão lógica via active): própria empresa + permissão de
-- editar ou de excluir (inativar). Não existe hard-delete: a regra de negócio
-- determina que categorias com produtos não podem ser excluídas, então o
-- "excluir" da UI é sempre inativação.
drop policy if exists "categories_update_with_permission" on public.categories;
create policy "categories_update_with_permission" on public.categories
  for update using (
    company_id = public.current_user_company_id()
    and (public.user_has_permission('categories.edit') or public.user_has_permission('categories.delete'))
  );
