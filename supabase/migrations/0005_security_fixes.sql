-- Adega Cloud — Sprint 03.1: Correções de segurança na RBAC
-- 1) Fecha a escalação de privilégio: um usuário conseguia alterar o próprio
--    role_id/status/company_id via update direto, já que a policy antiga
--    "users_update_self" (0001) não restringia colunas e a policy nova (0004)
--    é permissiva/OR — a antiga continuava valendo.
-- 2) Isola roles/permissions por empresa: roles não tinham company_id, então
--    um usuário com 'roles.manage' conseguia editar perfis de outras empresas.

-- =========================================
-- 1) Guarda contra escalação de privilégio em users
-- =========================================
create or replace function public.enforce_users_update_guard()
returns trigger as $$
begin
  if (new.role_id is distinct from old.role_id
      or new.status is distinct from old.status
      or new.company_id is distinct from old.company_id)
     and not public.user_has_permission('users.edit') then
    raise exception 'Sem permissão para alterar role_id, status ou company_id deste usuário'
      using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_users_update_guard on public.users;
create trigger trg_users_update_guard
before update on public.users
for each row execute function public.enforce_users_update_guard();

-- a policy "users_update_self" (0001) ficou redundante: a policy de 0004
-- já cobre "id = auth.uid()" dentro do seu próprio OR. Duas policies
-- fazendo a mesma checagem só confundem quem for ler isso depois.
drop policy if exists "users_update_self" on public.users;

-- =========================================
-- 2) Isolamento de roles/permissions por empresa
-- =========================================
alter table public.roles add column if not exists company_id uuid references public.companies(id) on delete cascade;

-- backfill: associa roles hoje órfãs à empresa mais antiga cadastrada
-- (hoje só existe "Adega Modelo" — em ambiente com mais de uma empresa
-- pré-existente isso precisaria de revisão manual antes de aplicar).
update public.roles set company_id = (
  select id from public.companies order by created_at asc limit 1
)
where company_id is null;

alter table public.roles alter column company_id set not null;

create index if not exists idx_roles_company_id on public.roles(company_id);

-- nome de perfil deixa de ser único globalmente e passa a ser único por empresa
alter table public.roles drop constraint if exists roles_name_key;
alter table public.roles drop constraint if exists roles_name_company_unique;
alter table public.roles add constraint roles_name_company_unique unique (company_id, name);

-- leitura de roles restrita à própria empresa (antes: qualquer autenticado via qualquer empresa)
drop policy if exists "roles_select_authenticated" on public.roles;
drop policy if exists "roles_select_same_company" on public.roles;
create policy "roles_select_same_company" on public.roles
  for select using (company_id = public.current_user_company_id());

drop policy if exists "roles_write_with_permission" on public.roles;
drop policy if exists "roles_insert_with_permission" on public.roles;
create policy "roles_insert_with_permission" on public.roles
  for insert with check (
    company_id = public.current_user_company_id() and public.user_has_permission('roles.manage')
  );

drop policy if exists "roles_update_with_permission" on public.roles;
create policy "roles_update_with_permission" on public.roles
  for update using (
    company_id = public.current_user_company_id() and public.user_has_permission('roles.manage')
  );

-- role_permissions: leitura e escrita passam a validar que a role referenciada
-- pertence à empresa do usuário (antes: qualquer autenticado lia tudo, e
-- 'roles.manage' bastava para escrever em roles de qualquer empresa)
drop policy if exists "role_permissions_select_authenticated" on public.role_permissions;
drop policy if exists "role_permissions_select_same_company" on public.role_permissions;
create policy "role_permissions_select_same_company" on public.role_permissions
  for select using (
    exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id and r.company_id = public.current_user_company_id()
    )
  );

drop policy if exists "role_permissions_insert_with_permission" on public.role_permissions;
create policy "role_permissions_insert_with_permission" on public.role_permissions
  for insert with check (
    public.user_has_permission('roles.manage')
    and exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id and r.company_id = public.current_user_company_id()
    )
  );

drop policy if exists "role_permissions_delete_with_permission" on public.role_permissions;
create policy "role_permissions_delete_with_permission" on public.role_permissions
  for delete using (
    public.user_has_permission('roles.manage')
    and exists (
      select 1 from public.roles r
      where r.id = role_permissions.role_id and r.company_id = public.current_user_company_id()
    )
  );
