-- Adega Cloud — Sprint 18: Notificações
-- Tabela conforme docs/02-BANCO-DADOS.md.txt (id, company_id, title, message,
-- type, read, created_at). Escopo desta sprint (docs/06): estoque baixo,
-- contas vencidas (a receber e a pagar), caixa aberto, alertas financeiros.
-- "Produtos sem movimentação", "backup com erro" e "falhas de integração"
-- (docs/03) ficam fora: não há job de backup nem integração externa
-- implementada nesta app ainda para gerar esses eventos de verdade.
--
-- Não existe scheduler/cron nesta app (sem CLI/infra local — só o dashboard
-- do Supabase). Em vez de um job periódico, o RPC generate_notifications()
-- é SECURITY DEFINER, idempotente (não duplica alerta já não-lido para a
-- mesma condição) e é chamado pelo client a cada abertura do sino/poll.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('estoque_baixo', 'financeiro_receber', 'financeiro_pagar', 'caixa_aberto'));

create index if not exists idx_notifications_company_id on public.notifications(company_id);
create index if not exists idx_notifications_company_read on public.notifications(company_id, read);

alter table public.notifications enable row level security;

-- Cada tipo de alerta só é visível a quem já tem o .view do módulo relacionado
-- (evita que um vendedor sem financial.view veja "conta vencida", por ex.).
drop policy if exists "notifications_select_same_company" on public.notifications;
create policy "notifications_select_same_company" on public.notifications
  for select using (
    company_id = public.current_user_company_id()
    and (
      (type = 'estoque_baixo' and public.user_has_permission('inventory.view'))
      or (type in ('financeiro_receber', 'financeiro_pagar') and public.user_has_permission('financial.view'))
      or (type = 'caixa_aberto' and public.user_has_permission('cash.view'))
    )
  );

-- Só o campo "read" pode ser alterado pelo client (marcar como lida).
create or replace function public.enforce_notifications_update_guard()
returns trigger as $$
begin
  if new.company_id is distinct from old.company_id
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.type is distinct from old.type
     or new.created_at is distinct from old.created_at then
    raise exception 'Somente o campo read pode ser alterado' using errcode = '42501';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notifications_update_guard on public.notifications;
create trigger trg_notifications_update_guard
before update on public.notifications
for each row execute function public.enforce_notifications_update_guard();

drop policy if exists "notifications_update_same_company" on public.notifications;
create policy "notifications_update_same_company" on public.notifications
  for update using (
    company_id = public.current_user_company_id()
    and (
      (type = 'estoque_baixo' and public.user_has_permission('inventory.view'))
      or (type in ('financeiro_receber', 'financeiro_pagar') and public.user_has_permission('financial.view'))
      or (type = 'caixa_aberto' and public.user_has_permission('cash.view'))
    )
  );

-- Sem policy de INSERT/DELETE: só o RPC (SECURITY DEFINER) grava, e o
-- histórico não é apagado (mesma regra de nunca excluir fisicamente).

create or replace function public.generate_notifications()
returns void as $$
declare
  v_company uuid := public.current_user_company_id();
begin
  if v_company is null then
    return;
  end if;

  -- Estoque baixo
  insert into public.notifications (company_id, title, message, type)
  select
    v_company,
    'Estoque baixo: ' || p.name,
    'Estoque atual: ' || p.current_stock || ', mínimo: ' || p.minimum_stock || '.',
    'estoque_baixo'
  from public.products p
  where p.company_id = v_company
    and p.active
    and p.current_stock <= p.minimum_stock
    and not exists (
      select 1 from public.notifications n
      where n.company_id = v_company
        and n.type = 'estoque_baixo'
        and n.title = 'Estoque baixo: ' || p.name
        and n.created_at > now() - interval '24 hours'
    );

  -- Contas a receber vencidas
  insert into public.notifications (company_id, title, message, type)
  select
    v_company,
    'Conta a receber vencida #' || substring(ar.id::text, 1, 8),
    coalesce(ar.description, 'Conta a receber') || ' — venceu em ' || to_char(ar.due_date, 'DD/MM/YYYY') ||
      ', valor em aberto R$ ' || to_char(ar.amount - ar.received_amount, 'FM999999990.00') || '.',
    'financeiro_receber'
  from public.accounts_receivable ar
  where ar.company_id = v_company
    and ar.status in ('Aberta', 'Parcial')
    and ar.due_date < current_date
    and not exists (
      select 1 from public.notifications n
      where n.company_id = v_company
        and n.type = 'financeiro_receber'
        and n.title = 'Conta a receber vencida #' || substring(ar.id::text, 1, 8)
        and n.created_at > now() - interval '24 hours'
    );

  -- Contas a pagar vencidas (alertas financeiros)
  insert into public.notifications (company_id, title, message, type)
  select
    v_company,
    'Conta a pagar vencida #' || substring(ap.id::text, 1, 8),
    coalesce(ap.description, 'Conta a pagar') || ' — venceu em ' || to_char(ap.due_date, 'DD/MM/YYYY') ||
      ', valor em aberto R$ ' || to_char(ap.amount - ap.paid_amount, 'FM999999990.00') || '.',
    'financeiro_pagar'
  from public.accounts_payable ap
  where ap.company_id = v_company
    and ap.status in ('Aberta', 'Parcial')
    and ap.due_date < current_date
    and not exists (
      select 1 from public.notifications n
      where n.company_id = v_company
        and n.type = 'financeiro_pagar'
        and n.title = 'Conta a pagar vencida #' || substring(ap.id::text, 1, 8)
        and n.created_at > now() - interval '24 hours'
    );

  -- Caixa aberto e esquecido de dias anteriores
  insert into public.notifications (company_id, title, message, type)
  select
    v_company,
    'Caixa aberto #' || substring(cr.id::text, 1, 8),
    'Caixa aberto desde ' || to_char(cr.opened_at, 'DD/MM/YYYY HH24:MI') || ' e ainda não foi fechado.',
    'caixa_aberto'
  from public.cash_registers cr
  where cr.company_id = v_company
    and cr.status = 'aberto'
    and cr.opened_at::date < current_date
    and not exists (
      select 1 from public.notifications n
      where n.company_id = v_company
        and n.type = 'caixa_aberto'
        and n.title = 'Caixa aberto #' || substring(cr.id::text, 1, 8)
        and n.created_at > now() - interval '24 hours'
    );
end;
$$ language plpgsql security definer set search_path = public;
