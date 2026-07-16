-- Adega Cloud — Sprint 16: Configurações
-- Tabela settings (1:1 com companies) para preferências da empresa
-- (tema, moeda, fuso horário, idioma, logo), conforme docs/02 "settings".
-- Também libera UPDATE em companies (Dados da Empresa) para quem tem
-- settings.edit — até aqui companies só tinha policy de SELECT.

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  currency text not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  language text not null default 'pt-BR',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at automático (função já criada em 0001)
drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

-- =========================================
-- RLS — settings
-- =========================================
alter table public.settings enable row level security;

-- Leitura: própria empresa + settings.view
drop policy if exists "settings_select_with_permission" on public.settings;
create policy "settings_select_with_permission" on public.settings
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('settings.view')
  );

-- Criação (primeira gravação de preferências): própria empresa + settings.edit
drop policy if exists "settings_insert_with_permission" on public.settings;
create policy "settings_insert_with_permission" on public.settings
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('settings.edit')
  );

-- Edição: própria empresa + settings.edit
drop policy if exists "settings_update_with_permission" on public.settings;
create policy "settings_update_with_permission" on public.settings
  for update using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('settings.edit')
  );

-- =========================================
-- RLS — companies (Dados da Empresa)
-- =========================================
-- Sem policy de DELETE: a empresa nunca é excluída pelo próprio sistema.
drop policy if exists "companies_update_with_permission" on public.companies;
create policy "companies_update_with_permission" on public.companies
  for update using (
    id = public.current_user_company_id()
    and public.user_has_permission('settings.edit')
  );
