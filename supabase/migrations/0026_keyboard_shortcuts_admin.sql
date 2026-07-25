-- Etapa 6 Fase 2: Configuração administrativa de atalhos de teclado
-- Permite: visualizar, editar, ativar, desativar, restaurar padrão, detectar conflitos

create table public.keyboard_shortcuts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  name text not null, -- F1, F2, Ctrl+N, etc (nome amigável)
  key text not null, -- "F1", "N", "S" (a tecla base)
  ctrl boolean default false,
  shift boolean default false,
  alt boolean default false,
  enabled boolean default true,
  action text not null, -- "open_help", "new_sale", "refresh", etc
  description text, -- "Abrir lista de atalhos", "Nova venda", etc
  module text, -- "sales", "inventory", "products", "cash" (scope)
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para busca rápida
create index idx_keyboard_shortcuts_company_role
  on public.keyboard_shortcuts(company_id, role_id, enabled);

create index idx_keyboard_shortcuts_conflict
  on public.keyboard_shortcuts(company_id, key, ctrl, shift, alt)
  where enabled = true;

-- RLS: administrador pode gerenciar todos os atalhos da empresa
alter table public.keyboard_shortcuts enable row level security;

create policy "admin_can_manage_shortcuts"
  on public.keyboard_shortcuts for all
  using (
    auth.jwt() ->> 'email' is not null and
    company_id = current_user_company_id() and
    exists (
      select 1 from public.users u
      join public.role_permissions rp on u.role_id = rp.role_id
      where u.id = auth.uid()
      and rp.permission_name = 'settings.edit'
      and u.company_id = company_id
    )
  )
  with check (
    auth.jwt() ->> 'email' is not null and
    company_id = current_user_company_id() and
    exists (
      select 1 from public.users u
      join public.role_permissions rp on u.role_id = rp.role_id
      where u.id = auth.uid()
      and rp.permission_name = 'settings.edit'
      and u.company_id = company_id
    )
  );

-- Seed: atalhos padrão (template para restaurar)
create table public.default_keyboard_shortcuts (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  key text not null,
  ctrl boolean default false,
  shift boolean default false,
  alt boolean default false,
  action text not null,
  description text,
  module text,
  created_at timestamptz default now()
);

-- Inserir padrões da Seção 25 do audit
insert into public.default_keyboard_shortcuts
  (name, key, ctrl, shift, alt, action, description, module)
values
  ('F1', 'F1', false, false, false, 'open_help', 'Abrir lista de atalhos', null),
  ('F2', 'F2', false, false, false, 'new_action', 'Criar novo item', null),
  ('F3', 'F3', false, false, false, 'focus_search', 'Focar busca', null),
  ('F5', 'F5', false, false, false, 'refresh', 'Atualizar dados da tela', null),
  ('F6', 'F6', false, false, false, 'focus_barcode', 'Focar código de barras', 'sales'),
  ('F8', 'F8', false, false, false, 'focus_discount', 'Focar desconto', 'sales'),
  ('F9', 'F9', false, false, false, 'focus_payment', 'Forma de pagamento', 'sales'),
  ('F10', 'F10', false, false, false, 'finalize', 'Finalizar venda', 'sales'),
  ('Delete', 'Delete', false, false, false, 'remove_item', 'Remover item', null),
  ('Ctrl+N', 'N', true, false, false, 'new_action', 'Nova ação rápida', null),
  ('Ctrl+S', 'S', true, false, false, 'save', 'Salvar', null),
  ('Ctrl+K', 'K', true, false, false, 'quick_search', 'Busca rápida', null),
  ('Ctrl+Shift+E', 'E', true, true, false, 'suprimento', 'Registrar suprimento', 'cash'),
  ('Ctrl+Shift+C', 'C', true, true, false, 'open_cash', 'Abrir caixa', 'cash'),
  ('Ctrl+Shift+F', 'F', true, true, false, 'close_cash', 'Fechar caixa', 'cash');

-- Função para detectar conflitos (duas shortcuts iguais ativas)
create or replace function detect_shortcut_conflicts(p_company_id uuid)
returns table (
  key text,
  ctrl boolean,
  shift boolean,
  alt boolean,
  count int,
  shortcuts_json jsonb
) as $$
select
  ks.key,
  ks.ctrl,
  ks.shift,
  ks.alt,
  count(*)::int,
  jsonb_agg(jsonb_build_object('id', ks.id, 'action', ks.action, 'name', ks.name)) as shortcuts_json
from public.keyboard_shortcuts ks
where ks.company_id = p_company_id
  and ks.enabled = true
group by ks.key, ks.ctrl, ks.shift, ks.alt
having count(*) > 1
$$ language sql security definer;

-- Função para restaurar atalhos padrão (limpa customizações, reinsere defaults)
create or replace function restore_default_shortcuts(p_company_id uuid, p_role_id uuid = null)
returns void as $$
begin
  -- Deletar atalhos customizados
  delete from public.keyboard_shortcuts
  where company_id = p_company_id
    and (p_role_id is null or role_id = p_role_id);

  -- Inserir defaults
  insert into public.keyboard_shortcuts
    (company_id, role_id, name, key, ctrl, shift, alt, enabled, action, description, module)
  select
    p_company_id,
    p_role_id,
    dks.name,
    dks.key,
    dks.ctrl,
    dks.shift,
    dks.alt,
    true,
    dks.action,
    dks.description,
    dks.module
  from public.default_keyboard_shortcuts dks;
end;
$$ language plpgsql security definer;
