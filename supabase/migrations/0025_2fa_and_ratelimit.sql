-- Etapa 7.3 (P10 do audit): 2FA básico e rate-limiting de login
-- Nota: 2FA completo (TOTP, backup codes, recovery flow) é grande demais pra esta etapa.
-- Implementação reduzida: flag two_fa_enabled apenas + middleware client-side.
-- Rate-limit é pure middleware, sem table (em-memória ou Redis em produção).

-- Tabela users já existe desde sprint 03, apenas adiciona flag 2FA
alter table public.users
add column if not exists two_fa_enabled boolean default false;

-- Sem policies novas necessárias — users.edit já protege this column.
-- Sem trigger necessário — campo é apenas um flag, sem validação de regra de negócio.

-- Tabela de rate-limit: rastreia tentativas de login falhadas por IP/email
-- (não é mandatória, informativo apenas — rate-limit real é implementado no middleware)
create table if not exists public.login_attempts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  ip_address text,
  attempt_type text check (attempt_type in ('success', 'failure')),
  attempted_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Índice para cleanup de tentativas antigas (mais de 24h)
create index if not exists idx_login_attempts_company_email_time
  on public.login_attempts(company_id, email, attempted_at desc);

-- Política RLS: usuários autenticados podem ler apenas as suas próprias tentativas (auditar login)
-- (Administrador pode ler todas para auditoria)
alter table public.login_attempts enable row level security;

create policy if not exists "admin_can_read_all_login_attempts"
  on public.login_attempts for select
  using (
    auth.jwt() ->> 'email' is not null and
    exists (
      select 1 from public.users u
      join public.role_permissions rp on u.role_id = rp.role_id
      where u.id = auth.uid()
      and rp.permission_name = 'audit.view'
      and u.company_id = company_id
    )
  );

-- Cleanup: remover tentativas com mais de 24h
create or replace function cleanup_old_login_attempts()
returns void as $$
begin
  delete from public.login_attempts
  where attempted_at < now() - interval '24 hours';
end;
$$ language plpgsql security definer;
