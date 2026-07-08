-- Adega Cloud — Sprint 03: Usuários e Permissões
-- Adiciona status (Ativo/Inativo/Bloqueado), função de checagem de permissão,
-- policies de escrita orientadas à matriz de permissões, e amplia o catálogo
-- de permissões para todos os módulos previstos no Sidebar.

-- =========================================
-- status do usuário (substitui o boolean active)
-- =========================================
alter table public.users add column if not exists status text;

update public.users set status = case when active then 'active' else 'inactive' end
where status is null;

alter table public.users alter column status set not null;
alter table public.users alter column status set default 'active';

alter table public.users drop constraint if exists users_status_check;
alter table public.users add constraint users_status_check
  check (status in ('active', 'inactive', 'blocked'));

alter table public.users drop column if exists active;

-- =========================================
-- Função: o usuário autenticado possui esta permissão?
-- =========================================
create or replace function public.user_has_permission(perm_name text)
returns boolean as $$
  select exists (
    select 1
    from public.users u
    join public.role_permissions rp on rp.role_id = u.role_id
    join public.permissions p on p.id = rp.permission_id
    where u.id = auth.uid() and p.name = perm_name
  )
$$ language sql stable security definer set search_path = public;

-- =========================================
-- Policies adicionais (escrita orientada à matriz de permissões)
-- =========================================
drop policy if exists "users_update_same_company_with_permission" on public.users;
create policy "users_update_same_company_with_permission" on public.users
  for update using (
    id = auth.uid()
    or (company_id = public.current_user_company_id() and public.user_has_permission('users.edit'))
  );

drop policy if exists "users_insert_with_permission" on public.users;
create policy "users_insert_with_permission" on public.users
  for insert with check (
    company_id = public.current_user_company_id() and public.user_has_permission('users.create')
  );

drop policy if exists "roles_write_with_permission" on public.roles;
create policy "roles_write_with_permission" on public.roles
  for insert with check (public.user_has_permission('roles.manage'));

drop policy if exists "roles_update_with_permission" on public.roles;
create policy "roles_update_with_permission" on public.roles
  for update using (public.user_has_permission('roles.manage'));

drop policy if exists "role_permissions_insert_with_permission" on public.role_permissions;
create policy "role_permissions_insert_with_permission" on public.role_permissions
  for insert with check (public.user_has_permission('roles.manage'));

drop policy if exists "role_permissions_delete_with_permission" on public.role_permissions;
create policy "role_permissions_delete_with_permission" on public.role_permissions
  for delete using (public.user_has_permission('roles.manage'));

-- =========================================
-- Catálogo de permissões por módulo (estrutura pronta para as próximas Sprints)
-- =========================================
insert into public.permissions (name, description) values
  ('categories.view', 'Ver categorias'),
  ('categories.create', 'Criar categorias'),
  ('categories.edit', 'Editar categorias'),
  ('categories.delete', 'Excluir categorias'),
  ('inventory.view', 'Ver estoque'),
  ('inventory.create', 'Registrar movimentação de estoque'),
  ('inventory.edit', 'Ajustar estoque'),
  ('inventory.approve', 'Aprovar inventário/ajustes'),
  ('purchases.view', 'Ver compras'),
  ('purchases.create', 'Criar compras'),
  ('purchases.edit', 'Editar compras'),
  ('purchases.cancel', 'Cancelar compras'),
  ('purchases.approve', 'Aprovar recebimento de compras'),
  ('sales.view', 'Ver vendas'),
  ('sales.cancel', 'Cancelar vendas'),
  ('sales.export', 'Exportar vendas'),
  ('customers.view', 'Ver clientes'),
  ('customers.create', 'Criar clientes'),
  ('customers.edit', 'Editar clientes'),
  ('customers.export', 'Exportar clientes'),
  ('customers.import', 'Importar clientes'),
  ('suppliers.view', 'Ver fornecedores'),
  ('suppliers.create', 'Criar fornecedores'),
  ('suppliers.edit', 'Editar fornecedores'),
  ('suppliers.export', 'Exportar fornecedores'),
  ('suppliers.import', 'Importar fornecedores'),
  ('financial.view', 'Ver financeiro'),
  ('financial.create', 'Criar lançamentos financeiros'),
  ('financial.edit', 'Editar lançamentos financeiros'),
  ('financial.approve', 'Aprovar pagamentos/recebimentos'),
  ('cash.view', 'Ver caixa'),
  ('cash.create', 'Registrar movimentação de caixa'),
  ('cash.approve', 'Aprovar fechamento de caixa'),
  ('reports.view', 'Ver relatórios'),
  ('reports.export', 'Exportar relatórios'),
  ('settings.view', 'Ver configurações'),
  ('settings.edit', 'Editar configurações'),
  ('users.view', 'Ver usuários'),
  ('users.create', 'Criar usuários'),
  ('users.edit', 'Editar usuários'),
  ('users.delete', 'Inativar usuários'),
  ('roles.manage', 'Gerenciar perfis e matriz de permissões')
on conflict (name) do nothing;

-- Administrador recebe automaticamente todas as permissões (inclusive as novas)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Administrador'
on conflict do nothing;
