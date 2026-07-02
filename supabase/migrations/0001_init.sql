-- Adega Cloud — Migração inicial (Sprint 01 + 02)
-- Tabelas mínimas para autenticação, permissões e auditoria funcionarem de verdade.

create extension if not exists "pgcrypto";

-- =========================================
-- companies
-- =========================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================
-- roles
-- =========================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- =========================================
-- permissions
-- =========================================
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

-- =========================================
-- role_permissions
-- =========================================
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- =========================================
-- users (perfil vinculado ao Supabase Auth — auth.users guarda a senha)
-- =========================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  role_id uuid references public.roles(id) on delete set null,
  name text not null,
  email text not null unique,
  phone text,
  active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_company_id on public.users(company_id);

-- =========================================
-- audit_logs
-- =========================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_company_id on public.audit_logs(company_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- =========================================
-- updated_at automático
-- =========================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- =========================================
-- Helper: company_id do usuário autenticado (usado nas policies de RLS)
-- =========================================
create or replace function public.current_user_company_id()
returns uuid as $$
  select company_id from public.users where id = auth.uid()
$$ language sql stable security definer set search_path = public;

-- =========================================
-- RLS
-- =========================================
alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.audit_logs enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

-- companies: usuário só vê a própria empresa
drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own" on public.companies
  for select using (id = public.current_user_company_id());

-- users: usuário só vê usuários da própria empresa e só edita o próprio registro
drop policy if exists "users_select_same_company" on public.users;
create policy "users_select_same_company" on public.users
  for select using (company_id = public.current_user_company_id());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update using (id = auth.uid());

-- audit_logs: leitura e inserção restritas à própria empresa
drop policy if exists "audit_logs_select_same_company" on public.audit_logs;
create policy "audit_logs_select_same_company" on public.audit_logs
  for select using (company_id = public.current_user_company_id());

drop policy if exists "audit_logs_insert_same_company" on public.audit_logs;
create policy "audit_logs_insert_same_company" on public.audit_logs
  for insert with check (company_id = public.current_user_company_id());

-- roles/permissions/role_permissions: dados de referência, leitura liberada a qualquer usuário autenticado
drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated" on public.roles
  for select using (auth.role() = 'authenticated');

drop policy if exists "permissions_select_authenticated" on public.permissions;
create policy "permissions_select_authenticated" on public.permissions
  for select using (auth.role() = 'authenticated');

drop policy if exists "role_permissions_select_authenticated" on public.role_permissions;
create policy "role_permissions_select_authenticated" on public.role_permissions
  for select using (auth.role() = 'authenticated');
