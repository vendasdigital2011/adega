-- Adega Cloud — Correção de segurança: role_id cross-tenant
-- Achado na auditoria pré-produção: nada validava que o role_id atribuído a um
-- usuário pertencesse à mesma company_id dele. Isso valia tanto para o UPDATE
-- via RLS (users_update_same_company_with_permission, 0004) quanto para o
-- INSERT feito por /api/users (que usa a service role key e por isso ignora
-- RLS por completo). Um usuário com 'users.edit'/'users.create' na própria
-- empresa poderia, em teoria, atribuir a um colega o role_id de uma role de
-- outra empresa, herdando as permissões definidas por essa role estrangeira
-- (user_has_permission também nunca checa roles.company_id).
--
-- A trigger roda em BEFORE INSERT/UPDATE e por isso vale para qualquer
-- caminho de escrita na tabela, inclusive via service role (triggers não são
-- ignorados por RLS bypass — só policies são).

create or replace function public.enforce_users_role_company_guard()
returns trigger as $$
begin
  if new.role_id is not null and not exists (
    select 1 from public.roles r
    where r.id = new.role_id and r.company_id = new.company_id
  ) then
    raise exception 'role_id não pertence à mesma empresa do usuário'
      using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_users_role_company_guard on public.users;
create trigger trg_users_role_company_guard
before insert or update on public.users
for each row execute function public.enforce_users_role_company_guard();
