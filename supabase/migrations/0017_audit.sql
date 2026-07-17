-- Adega Cloud — Sprint 17: Auditoria
-- A tabela audit_logs já existe desde 0001 (id, company_id, user_id, table_name,
-- record_id, action, old_data, new_data, ip, created_at) e todos os services já
-- gravam nela via BaseService.auditAsCurrentUser; o AuthService registra
-- LOGIN/LOGOUT/PASSWORD_CHANGE. Esta migration apenas:
--   1) cria a permissão audit.view e concede ao Administrador;
--   2) endurece a policy de SELECT para exigir audit.view (antes qualquer
--      usuário da empresa lia os logs).
-- A policy de INSERT permanece intacta: todo usuário autenticado da empresa
-- precisa poder gravar log da própria ação (o log é escrito como o usuário
-- que agiu, não por um papel privilegiado).

-- =========================================
-- Permissão
-- =========================================
insert into public.permissions (name, description) values
  ('audit.view', 'Ver logs de auditoria')
on conflict (name) do nothing;

-- Administrador recebe a nova permissão
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Administrador'
  and p.name = 'audit.view'
on conflict do nothing;

-- =========================================
-- RLS — audit_logs (endurece leitura)
-- =========================================
-- Leitura: própria empresa + audit.view (antes era só company scope).
drop policy if exists "audit_logs_select_same_company" on public.audit_logs;
drop policy if exists "audit_logs_select_with_permission" on public.audit_logs;
create policy "audit_logs_select_with_permission" on public.audit_logs
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('audit.view')
  );

-- INSERT permanece: própria empresa (mantida de 0001, recriada aqui por clareza).
drop policy if exists "audit_logs_insert_same_company" on public.audit_logs;
create policy "audit_logs_insert_same_company" on public.audit_logs
  for insert with check (company_id = public.current_user_company_id());

-- Sem policies de UPDATE/DELETE: o log de auditoria é imutável.
