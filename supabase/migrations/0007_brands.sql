-- Adega Cloud — Sprint 06: Marcas
-- Tabela de marcas de produtos, multi-tenant, nome único por empresa,
-- exclusão lógica (active) e RLS orientada às permissões brands.*.
-- Também semeia o catálogo de permissões brands.* (não existia ainda).

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brands_company_id on public.brands(company_id);

alter table public.brands drop constraint if exists brands_name_company_unique;
alter table public.brands add constraint brands_name_company_unique unique (company_id, name);

drop trigger if exists trg_brands_updated_at on public.brands;
create trigger trg_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

-- =========================================
-- Permissões brands.* (não haviam sido semeadas)
-- =========================================
insert into public.permissions (name, description) values
  ('brands.view', 'Ver marcas'),
  ('brands.create', 'Criar marcas'),
  ('brands.edit', 'Editar marcas'),
  ('brands.delete', 'Inativar marcas')
on conflict (name) do nothing;

-- Administrador recebe as novas permissões
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Administrador' and p.name like 'brands.%'
on conflict do nothing;

-- =========================================
-- RLS
-- =========================================
alter table public.brands enable row level security;

drop policy if exists "brands_select_same_company" on public.brands;
create policy "brands_select_same_company" on public.brands
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('brands.view')
  );

drop policy if exists "brands_insert_with_permission" on public.brands;
create policy "brands_insert_with_permission" on public.brands
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('brands.create')
  );

-- Edição inclui exclusão lógica (active). Sem hard-delete: marcas com produtos
-- não devem ser removidas, apenas inativadas.
drop policy if exists "brands_update_with_permission" on public.brands;
create policy "brands_update_with_permission" on public.brands
  for update using (
    company_id = public.current_user_company_id()
    and (public.user_has_permission('brands.edit') or public.user_has_permission('brands.delete'))
  );
