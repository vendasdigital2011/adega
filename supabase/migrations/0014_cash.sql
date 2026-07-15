-- Adega Cloud — Sprint 13: Caixa
-- cash_registers (sessões de abertura/fechamento) + cash_movements (ledger
-- imutável). Regras: só um caixa aberto por usuário; venda exige caixa aberto;
-- sangria/suprimento nunca são excluídos. Toda venda finalizada gera
-- automaticamente uma Entrada no caixa aberto do usuário; cancelamento gera
-- uma Saída de estorno. create_sale/cancel_sale (0013) são substituídas para
-- incorporar essa exigência.

-- =========================================
-- Tabelas
-- =========================================
create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  opened_by uuid references public.users(id) on delete set null,
  opened_at timestamptz not null default now(),
  initial_value numeric(12,2) not null default 0,
  closed_by uuid references public.users(id) on delete set null,
  closed_at timestamptz,
  final_value numeric(12,2),
  difference numeric(12,2),
  status text not null default 'aberto'
);

alter table public.cash_registers drop constraint if exists cash_registers_status_check;
alter table public.cash_registers add constraint cash_registers_status_check
  check (status in ('aberto','fechado'));

create index if not exists idx_cash_registers_company_id on public.cash_registers(company_id);

-- Só um caixa aberto por usuário (regra de negócio).
drop index if exists public.idx_cash_registers_one_open_per_user;
create unique index idx_cash_registers_one_open_per_user
  on public.cash_registers (opened_by)
  where status = 'aberto';

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete restrict,
  movement_type text not null,
  value numeric(12,2) not null,
  description text,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.cash_movements drop constraint if exists cash_movements_type_check;
alter table public.cash_movements add constraint cash_movements_type_check
  check (movement_type in ('Entrada','Saída','Sangria','Suprimento'));

alter table public.cash_movements drop constraint if exists cash_movements_value_positive;
alter table public.cash_movements add constraint cash_movements_value_positive
  check (value > 0);

create index if not exists idx_cash_movements_register_id on public.cash_movements(cash_register_id);

-- =========================================
-- RLS: leitura por empresa/permissão. Escrita só via as funções abaixo —
-- nenhuma policy de insert/update/delete = imutável e só-por-função.
-- =========================================
alter table public.cash_registers enable row level security;
alter table public.cash_movements enable row level security;

drop policy if exists "cash_registers_select_same_company" on public.cash_registers;
create policy "cash_registers_select_same_company" on public.cash_registers
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('cash.view')
  );

drop policy if exists "cash_movements_select_same_company" on public.cash_movements;
create policy "cash_movements_select_same_company" on public.cash_movements
  for select using (
    exists (
      select 1 from public.cash_registers cr
      where cr.id = cash_movements.cash_register_id
        and cr.company_id = public.current_user_company_id()
        and public.user_has_permission('cash.view')
    )
  );

-- =========================================
-- Helper interno: caixa aberto do usuário atual (ou null).
-- =========================================
create or replace function public._current_open_cash_register(p_user uuid, p_company uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.cash_registers
  where opened_by = p_user and company_id = p_company and status = 'aberto'
  limit 1
$$;

-- =========================================
-- Abrir caixa.
-- =========================================
create or replace function public.open_cash_register(p_initial_value numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_id uuid;
begin
  if not public.user_has_permission('cash.manage') then
    raise exception 'Sem permissão para abrir caixa' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  if public._current_open_cash_register(auth.uid(), v_company) is not null then
    raise exception 'Você já possui um caixa aberto' using errcode = '55000';
  end if;

  if p_initial_value is null or p_initial_value < 0 then
    raise exception 'Valor inicial inválido' using errcode = '22023';
  end if;

  insert into public.cash_registers(company_id, opened_by, initial_value, status)
  values (v_company, auth.uid(), p_initial_value, 'aberto')
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================================
-- Fechar caixa: calcula saldo esperado a partir dos movimentos, compara com
-- o valor contado (p_final_value) informado pelo usuário e grava a diferença.
-- =========================================
create or replace function public.close_cash_register(p_cash_register_id uuid, p_final_value numeric)
returns public.cash_registers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_row public.cash_registers;
  v_expected numeric(12,2);
begin
  if not public.user_has_permission('cash.approve') then
    raise exception 'Sem permissão para fechar caixa' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select * into v_row from public.cash_registers
  where id = p_cash_register_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Caixa não encontrado' using errcode = 'P0002';
  end if;
  if v_row.status <> 'aberto' then
    raise exception 'Este caixa já está fechado' using errcode = '22023';
  end if;

  select v_row.initial_value
    + coalesce(sum(value) filter (where movement_type in ('Entrada','Suprimento')), 0)
    - coalesce(sum(value) filter (where movement_type in ('Saída','Sangria')), 0)
  into v_expected
  from public.cash_movements
  where cash_register_id = p_cash_register_id;

  update public.cash_registers set
    status = 'fechado',
    closed_by = auth.uid(),
    closed_at = now(),
    final_value = p_final_value,
    difference = p_final_value - v_expected
  where id = p_cash_register_id
  returning * into v_row;

  return v_row;
end;
$$;

-- =========================================
-- Registrar movimento manual (Sangria/Suprimento). Entrada/Saída automáticas
-- de venda são gravadas internamente por create_sale/cancel_sale.
-- =========================================
create or replace function public.register_cash_movement(
  p_cash_register_id uuid,
  p_movement_type text,
  p_value numeric,
  p_description text default null
) returns public.cash_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_status text;
  v_row public.cash_movements;
begin
  if not public.user_has_permission('cash.create') then
    raise exception 'Sem permissão para registrar movimentação de caixa' using errcode = '42501';
  end if;

  if p_movement_type not in ('Sangria','Suprimento') then
    raise exception 'Tipo de movimentação manual inválido: %', p_movement_type using errcode = '22023';
  end if;

  if p_value is null or p_value <= 0 then
    raise exception 'Valor deve ser maior que zero' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  select status into v_status from public.cash_registers
  where id = p_cash_register_id and company_id = v_company;

  if v_status is null then
    raise exception 'Caixa não encontrado' using errcode = 'P0002';
  end if;
  if v_status <> 'aberto' then
    raise exception 'Não é possível movimentar um caixa fechado' using errcode = '22023';
  end if;

  insert into public.cash_movements(cash_register_id, movement_type, value, description, user_id)
  values (p_cash_register_id, p_movement_type, p_value, p_description, auth.uid())
  returning * into v_row;

  return v_row;
end;
$$;

-- =========================================
-- create_sale / cancel_sale (substituem 0013): agora exigem caixa aberto do
-- usuário e geram movimento de caixa automático (Entrada / Saída de estorno).
-- =========================================
create or replace function public.create_sale(
  p_customer_id uuid,
  p_sale_date date,
  p_discount numeric,
  p_payment_method text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_register uuid;
  v_sale_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2);
  v_item jsonb;
  v_qty integer;
  v_price numeric(12,2);
  v_line numeric(12,2);
begin
  if not public.user_has_permission('sales.create') then
    raise exception 'Sem permissão para criar vendas' using errcode = '42501';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A venda deve ter ao menos um item' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  v_register := public._current_open_cash_register(auth.uid(), v_company);
  if v_register is null then
    raise exception 'É necessário abrir o caixa antes de realizar vendas' using errcode = '55000';
  end if;

  if p_customer_id is not null
     and not exists (select 1 from public.customers where id = p_customer_id and company_id = v_company) then
    raise exception 'Cliente inválido' using errcode = 'P0002';
  end if;

  insert into public.sales(company_id, customer_id, sale_date, subtotal, discount, total, payment_method, status, created_by)
  values (v_company, p_customer_id, coalesce(p_sale_date, current_date), 0, coalesce(p_discount,0), 0, p_payment_method, 'finalizada', auth.uid())
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    v_price := (v_item->>'unit_price')::numeric;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantidade do item deve ser maior que zero' using errcode = '22023';
    end if;
    if not exists (select 1 from public.products where id = (v_item->>'product_id')::uuid and company_id = v_company) then
      raise exception 'Produto inválido em um dos itens' using errcode = 'P0002';
    end if;
    v_line := v_qty * v_price;
    v_subtotal := v_subtotal + v_line;

    insert into public.sale_items(sale_id, product_id, quantity, unit_price, total)
    values (v_sale_id, (v_item->>'product_id')::uuid, v_qty, v_price, v_line);

    perform public._apply_stock_movement(
      v_company, (v_item->>'product_id')::uuid, 'Venda', v_qty,
      'Venda ' || left(v_sale_id::text, 8), 'Baixa por venda'
    );
  end loop;

  v_total := v_subtotal - coalesce(p_discount,0);

  update public.sales set subtotal = v_subtotal, total = v_total where id = v_sale_id;

  if v_total > 0 then
    insert into public.cash_movements(cash_register_id, movement_type, value, description, user_id)
    values (v_register, 'Entrada', v_total, 'Venda ' || left(v_sale_id::text, 8), auth.uid());
  end if;

  return v_sale_id;
end;
$$;

create or replace function public.cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_register uuid;
  v_status text;
  v_total numeric(12,2);
  v_it record;
begin
  if not public.user_has_permission('sales.cancel') then
    raise exception 'Sem permissão para cancelar vendas' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select status, total into v_status, v_total from public.sales
  where id = p_sale_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Venda não encontrada' using errcode = 'P0002';
  end if;
  if v_status = 'cancelada' then
    raise exception 'Venda já está cancelada' using errcode = '22023';
  end if;

  v_register := public._current_open_cash_register(auth.uid(), v_company);
  if v_register is null then
    raise exception 'É necessário abrir o caixa antes de cancelar vendas' using errcode = '55000';
  end if;

  for v_it in select product_id, quantity from public.sale_items where sale_id = p_sale_id
  loop
    perform public._apply_stock_movement(
      v_company, v_it.product_id, 'Entrada', v_it.quantity,
      'Estorno venda ' || left(p_sale_id::text, 8), 'Cancelamento de venda'
    );
  end loop;

  if v_total > 0 then
    insert into public.cash_movements(cash_register_id, movement_type, value, description, user_id)
    values (v_register, 'Saída', v_total, 'Estorno venda ' || left(p_sale_id::text, 8), auth.uid());
  end if;

  update public.sales set status = 'cancelada' where id = p_sale_id;
end;
$$;
