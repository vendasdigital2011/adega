-- Adega Cloud — Sprint 14: Financeiro
-- Contas a Receber / Contas a Pagar (geradas por Venda/Compra ou lançamento
-- manual — "lançamento manual" em Receber é a Receita avulsa, em Pagar é a
-- Despesa avulsa) + Centro de Custos. Baixas (recebimentos/pagamentos) em
-- tabelas próprias, imutáveis (sem update/delete). "Fluxo de Caixa" não é uma
-- tabela nova: é a leitura combinada de receivable_receipts + payable_payments
-- + cash_movements (já existentes), feita no client (FinancialService).
--
-- Integração com Vendas: pagamento 'Fiado' passa a não gerar mais Entrada no
-- caixa (o dinheiro ainda não entrou) e sim uma conta a receber vinculada à
-- venda. Cancelar uma venda fiado cancela a conta a receber (bloqueado se já
-- houve recebimento parcial).
--
-- Integração com Compras: ao RECEBER uma compra, agora também é gerada uma
-- conta a pagar vinculada (vencimento padrão de 30 dias). Cancelar a compra
-- cancela a conta a pagar (bloqueado se já houve pagamento parcial).

-- =========================================
-- Formas de pagamento: completar o catálogo do PDR-004 (Boleto, Transferência
-- e Fiado, além das já existentes).
-- =========================================
alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('Dinheiro','PIX','Cartão de Débito','Cartão de Crédito','Boleto','Transferência','Fiado'));

-- =========================================
-- Tabelas
-- =========================================
create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cost_centers_company_id on public.cost_centers(company_id);

alter table public.cost_centers drop constraint if exists cost_centers_name_company_unique;
alter table public.cost_centers add constraint cost_centers_name_company_unique unique (company_id, name);

drop trigger if exists trg_cost_centers_updated_at on public.cost_centers;
create trigger trg_cost_centers_updated_at
before update on public.cost_centers
for each row execute function public.set_updated_at();

create table if not exists public.accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  cost_center_id uuid references public.cost_centers(id) on delete set null,
  description text,
  due_date date not null,
  amount numeric(12,2) not null,
  received_amount numeric(12,2) not null default 0,
  status text not null default 'Aberta',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts_receivable drop constraint if exists accounts_receivable_amount_positive;
alter table public.accounts_receivable add constraint accounts_receivable_amount_positive check (amount > 0);

alter table public.accounts_receivable drop constraint if exists accounts_receivable_status_check;
alter table public.accounts_receivable add constraint accounts_receivable_status_check
  check (status in ('Aberta','Parcial','Recebida','Cancelada'));

create index if not exists idx_accounts_receivable_company_id on public.accounts_receivable(company_id);
create index if not exists idx_accounts_receivable_customer_id on public.accounts_receivable(customer_id);
create index if not exists idx_accounts_receivable_sale_id on public.accounts_receivable(sale_id);

drop trigger if exists trg_accounts_receivable_updated_at on public.accounts_receivable;
create trigger trg_accounts_receivable_updated_at
before update on public.accounts_receivable
for each row execute function public.set_updated_at();

create table if not exists public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  purchase_id uuid references public.purchases(id) on delete set null,
  cost_center_id uuid references public.cost_centers(id) on delete set null,
  description text,
  due_date date not null,
  amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'Aberta',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.accounts_payable drop constraint if exists accounts_payable_amount_positive;
alter table public.accounts_payable add constraint accounts_payable_amount_positive check (amount > 0);

alter table public.accounts_payable drop constraint if exists accounts_payable_status_check;
alter table public.accounts_payable add constraint accounts_payable_status_check
  check (status in ('Aberta','Parcial','Paga','Cancelada'));

create index if not exists idx_accounts_payable_company_id on public.accounts_payable(company_id);
create index if not exists idx_accounts_payable_supplier_id on public.accounts_payable(supplier_id);
create index if not exists idx_accounts_payable_purchase_id on public.accounts_payable(purchase_id);

drop trigger if exists trg_accounts_payable_updated_at on public.accounts_payable;
create trigger trg_accounts_payable_updated_at
before update on public.accounts_payable
for each row execute function public.set_updated_at();

create table if not exists public.receivable_receipts (
  id uuid primary key default gen_random_uuid(),
  accounts_receivable_id uuid not null references public.accounts_receivable(id) on delete restrict,
  value numeric(12,2) not null,
  description text,
  user_id uuid references public.users(id) on delete set null,
  received_at timestamptz not null default now()
);

alter table public.receivable_receipts drop constraint if exists receivable_receipts_value_positive;
alter table public.receivable_receipts add constraint receivable_receipts_value_positive check (value > 0);

create index if not exists idx_receivable_receipts_account_id on public.receivable_receipts(accounts_receivable_id);

create table if not exists public.payable_payments (
  id uuid primary key default gen_random_uuid(),
  accounts_payable_id uuid not null references public.accounts_payable(id) on delete restrict,
  value numeric(12,2) not null,
  description text,
  user_id uuid references public.users(id) on delete set null,
  paid_at timestamptz not null default now()
);

alter table public.payable_payments drop constraint if exists payable_payments_value_positive;
alter table public.payable_payments add constraint payable_payments_value_positive check (value > 0);

create index if not exists idx_payable_payments_account_id on public.payable_payments(accounts_payable_id);

-- =========================================
-- RLS
-- =========================================
alter table public.cost_centers enable row level security;
alter table public.accounts_receivable enable row level security;
alter table public.accounts_payable enable row level security;
alter table public.receivable_receipts enable row level security;
alter table public.payable_payments enable row level security;

-- Centro de custos: catálogo simples, igual a categorias/marcas.
drop policy if exists "cost_centers_select_same_company" on public.cost_centers;
create policy "cost_centers_select_same_company" on public.cost_centers
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('financial.view')
  );

drop policy if exists "cost_centers_insert_with_permission" on public.cost_centers;
create policy "cost_centers_insert_with_permission" on public.cost_centers
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('financial.create')
  );

drop policy if exists "cost_centers_update_with_permission" on public.cost_centers;
create policy "cost_centers_update_with_permission" on public.cost_centers
  for update using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('financial.edit')
  );

-- Contas a receber/pagar e suas baixas: leitura por empresa/permissão,
-- escrita só via funções (ledger financeiro, sem policy de insert/update).
drop policy if exists "accounts_receivable_select_same_company" on public.accounts_receivable;
create policy "accounts_receivable_select_same_company" on public.accounts_receivable
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('financial.view')
  );

drop policy if exists "accounts_payable_select_same_company" on public.accounts_payable;
create policy "accounts_payable_select_same_company" on public.accounts_payable
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('financial.view')
  );

drop policy if exists "receivable_receipts_select_same_company" on public.receivable_receipts;
create policy "receivable_receipts_select_same_company" on public.receivable_receipts
  for select using (
    exists (
      select 1 from public.accounts_receivable ar
      where ar.id = receivable_receipts.accounts_receivable_id
        and ar.company_id = public.current_user_company_id()
        and public.user_has_permission('financial.view')
    )
  );

drop policy if exists "payable_payments_select_same_company" on public.payable_payments;
create policy "payable_payments_select_same_company" on public.payable_payments
  for select using (
    exists (
      select 1 from public.accounts_payable ap
      where ap.id = payable_payments.accounts_payable_id
        and ap.company_id = public.current_user_company_id()
        and public.user_has_permission('financial.view')
    )
  );

-- =========================================
-- Lançamento manual de conta a receber (Receita avulsa quando sem cliente).
-- =========================================
create or replace function public.create_receivable(
  p_customer_id uuid,
  p_cost_center_id uuid,
  p_description text,
  p_due_date date,
  p_amount numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_id uuid;
begin
  if not public.user_has_permission('financial.create') then
    raise exception 'Sem permissão para criar lançamentos financeiros' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero' using errcode = '22023';
  end if;
  if p_due_date is null then
    raise exception 'Data de vencimento é obrigatória' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  if p_customer_id is not null
     and not exists (select 1 from public.customers where id = p_customer_id and company_id = v_company) then
    raise exception 'Cliente inválido' using errcode = 'P0002';
  end if;
  if p_cost_center_id is not null
     and not exists (select 1 from public.cost_centers where id = p_cost_center_id and company_id = v_company) then
    raise exception 'Centro de custo inválido' using errcode = 'P0002';
  end if;

  insert into public.accounts_receivable(company_id, customer_id, cost_center_id, description, due_date, amount, status, created_by)
  values (v_company, p_customer_id, p_cost_center_id, p_description, p_due_date, p_amount, 'Aberta', auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================================
-- Lançamento manual de conta a pagar (Despesa avulsa quando sem fornecedor).
-- =========================================
create or replace function public.create_payable(
  p_supplier_id uuid,
  p_cost_center_id uuid,
  p_description text,
  p_due_date date,
  p_amount numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_id uuid;
begin
  if not public.user_has_permission('financial.create') then
    raise exception 'Sem permissão para criar lançamentos financeiros' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor deve ser maior que zero' using errcode = '22023';
  end if;
  if p_due_date is null then
    raise exception 'Data de vencimento é obrigatória' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  if p_supplier_id is not null
     and not exists (select 1 from public.suppliers where id = p_supplier_id and company_id = v_company) then
    raise exception 'Fornecedor inválido' using errcode = 'P0002';
  end if;
  if p_cost_center_id is not null
     and not exists (select 1 from public.cost_centers where id = p_cost_center_id and company_id = v_company) then
    raise exception 'Centro de custo inválido' using errcode = 'P0002';
  end if;

  insert into public.accounts_payable(company_id, supplier_id, cost_center_id, description, due_date, amount, status, created_by)
  values (v_company, p_supplier_id, p_cost_center_id, p_description, p_due_date, p_amount, 'Aberta', auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================================
-- Registrar recebimento (baixa total ou parcial) de uma conta a receber.
-- =========================================
create or replace function public.register_receipt(
  p_accounts_receivable_id uuid,
  p_value numeric,
  p_description text default null
) returns public.accounts_receivable
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_row public.accounts_receivable;
  v_outstanding numeric(12,2);
begin
  if not public.user_has_permission('financial.approve') then
    raise exception 'Sem permissão para registrar recebimentos' using errcode = '42501';
  end if;
  if p_value is null or p_value <= 0 then
    raise exception 'Valor deve ser maior que zero' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  select * into v_row from public.accounts_receivable
  where id = p_accounts_receivable_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Conta a receber não encontrada' using errcode = 'P0002';
  end if;
  if v_row.status in ('Recebida','Cancelada') then
    raise exception 'Esta conta não pode receber pagamentos (status atual: %)', v_row.status using errcode = '22023';
  end if;

  v_outstanding := v_row.amount - v_row.received_amount;
  if p_value > v_outstanding then
    raise exception 'Valor informado (%) excede o saldo em aberto (%)', p_value, v_outstanding using errcode = '22023';
  end if;

  insert into public.receivable_receipts(accounts_receivable_id, value, description, user_id)
  values (p_accounts_receivable_id, p_value, p_description, auth.uid());

  update public.accounts_receivable
  set received_amount = received_amount + p_value,
      status = case when received_amount + p_value >= amount then 'Recebida' else 'Parcial' end
  where id = p_accounts_receivable_id
  returning * into v_row;

  return v_row;
end;
$$;

-- =========================================
-- Registrar pagamento (baixa total ou parcial) de uma conta a pagar.
-- =========================================
create or replace function public.register_payment(
  p_accounts_payable_id uuid,
  p_value numeric,
  p_description text default null
) returns public.accounts_payable
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_row public.accounts_payable;
  v_outstanding numeric(12,2);
begin
  if not public.user_has_permission('financial.approve') then
    raise exception 'Sem permissão para registrar pagamentos' using errcode = '42501';
  end if;
  if p_value is null or p_value <= 0 then
    raise exception 'Valor deve ser maior que zero' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  select * into v_row from public.accounts_payable
  where id = p_accounts_payable_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Conta a pagar não encontrada' using errcode = 'P0002';
  end if;
  if v_row.status in ('Paga','Cancelada') then
    raise exception 'Esta conta não pode receber pagamentos (status atual: %)', v_row.status using errcode = '22023';
  end if;

  v_outstanding := v_row.amount - v_row.paid_amount;
  if p_value > v_outstanding then
    raise exception 'Valor informado (%) excede o saldo em aberto (%)', p_value, v_outstanding using errcode = '22023';
  end if;

  insert into public.payable_payments(accounts_payable_id, value, description, user_id)
  values (p_accounts_payable_id, p_value, p_description, auth.uid());

  update public.accounts_payable
  set paid_amount = paid_amount + p_value,
      status = case when paid_amount + p_value >= amount then 'Paga' else 'Parcial' end
  where id = p_accounts_payable_id
  returning * into v_row;

  return v_row;
end;
$$;

-- =========================================
-- Cancelar conta a receber/pagar. Bloqueado se já houve recebimento/pagamento
-- parcial (nesse caso é preciso tratar manualmente antes de cancelar).
-- =========================================
create or replace function public.cancel_receivable(p_accounts_receivable_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_row public.accounts_receivable;
begin
  if not public.user_has_permission('financial.edit') then
    raise exception 'Sem permissão para cancelar contas a receber' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select * into v_row from public.accounts_receivable
  where id = p_accounts_receivable_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Conta a receber não encontrada' using errcode = 'P0002';
  end if;
  if v_row.status = 'Cancelada' then
    raise exception 'Conta já está cancelada' using errcode = '22023';
  end if;
  if v_row.received_amount > 0 then
    raise exception 'Não é possível cancelar: já há recebimento registrado nesta conta' using errcode = '22023';
  end if;

  update public.accounts_receivable set status = 'Cancelada' where id = p_accounts_receivable_id;
end;
$$;

create or replace function public.cancel_payable(p_accounts_payable_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_row public.accounts_payable;
begin
  if not public.user_has_permission('financial.edit') then
    raise exception 'Sem permissão para cancelar contas a pagar' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select * into v_row from public.accounts_payable
  where id = p_accounts_payable_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Conta a pagar não encontrada' using errcode = 'P0002';
  end if;
  if v_row.status = 'Cancelada' then
    raise exception 'Conta já está cancelada' using errcode = '22023';
  end if;
  if v_row.paid_amount > 0 then
    raise exception 'Não é possível cancelar: já há pagamento registrado nesta conta' using errcode = '22023';
  end if;

  update public.accounts_payable set status = 'Cancelada' where id = p_accounts_payable_id;
end;
$$;

-- =========================================
-- create_sale / cancel_sale (substituem 0014): pagamento 'Fiado' não gera mais
-- movimento de caixa — gera/cancela uma conta a receber vinculada à venda.
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

  if p_payment_method = 'Fiado' and p_customer_id is null then
    raise exception 'Venda fiado exige um cliente' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  if p_payment_method <> 'Fiado' then
    v_register := public._current_open_cash_register(auth.uid(), v_company);
    if v_register is null then
      raise exception 'É necessário abrir o caixa antes de realizar vendas' using errcode = '55000';
    end if;
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
    if p_payment_method = 'Fiado' then
      insert into public.accounts_receivable(company_id, customer_id, sale_id, description, due_date, amount, status, created_by)
      values (v_company, p_customer_id, v_sale_id, 'Venda ' || left(v_sale_id::text, 8), coalesce(p_sale_date, current_date) + 30, v_total, 'Aberta', auth.uid());
    else
      insert into public.cash_movements(cash_register_id, movement_type, value, description, user_id)
      values (v_register, 'Entrada', v_total, 'Venda ' || left(v_sale_id::text, 8), auth.uid());
    end if;
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
  v_payment_method text;
  v_receivable public.accounts_receivable;
  v_has_receivable boolean := false;
  v_it record;
begin
  if not public.user_has_permission('sales.cancel') then
    raise exception 'Sem permissão para cancelar vendas' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select status, total, payment_method into v_status, v_total, v_payment_method from public.sales
  where id = p_sale_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Venda não encontrada' using errcode = 'P0002';
  end if;
  if v_status = 'cancelada' then
    raise exception 'Venda já está cancelada' using errcode = '22023';
  end if;

  if v_payment_method = 'Fiado' then
    select * into v_receivable from public.accounts_receivable
    where sale_id = p_sale_id
    for update;
    v_has_receivable := found;

    if v_has_receivable and v_receivable.received_amount > 0 then
      raise exception 'Não é possível cancelar: já há recebimento registrado nesta venda fiado' using errcode = '22023';
    end if;
  else
    v_register := public._current_open_cash_register(auth.uid(), v_company);
    if v_register is null then
      raise exception 'É necessário abrir o caixa antes de cancelar vendas' using errcode = '55000';
    end if;
  end if;

  for v_it in select product_id, quantity from public.sale_items where sale_id = p_sale_id
  loop
    perform public._apply_stock_movement(
      v_company, v_it.product_id, 'Entrada', v_it.quantity,
      'Estorno venda ' || left(p_sale_id::text, 8), 'Cancelamento de venda'
    );
  end loop;

  if v_payment_method = 'Fiado' then
    if v_has_receivable then
      update public.accounts_receivable set status = 'Cancelada' where id = v_receivable.id;
    end if;
  elsif v_total > 0 then
    insert into public.cash_movements(cash_register_id, movement_type, value, description, user_id)
    values (v_register, 'Saída', v_total, 'Estorno venda ' || left(p_sale_id::text, 8), auth.uid());
  end if;

  update public.sales set status = 'cancelada' where id = p_sale_id;
end;
$$;

-- =========================================
-- receive_purchase / cancel_purchase (substituem 0012): receber uma compra
-- agora também gera uma conta a pagar vinculada (vencimento em +30 dias).
-- Cancelar a compra cancela a conta a pagar (bloqueado se já houve pagamento).
-- =========================================
create or replace function public.receive_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_status text;
  v_supplier_id uuid;
  v_purchase_date date;
  v_total numeric(12,2);
  v_it record;
begin
  if not public.user_has_permission('purchases.approve') then
    raise exception 'Sem permissão para receber compras' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select status, supplier_id, purchase_date, total into v_status, v_supplier_id, v_purchase_date, v_total
  from public.purchases
  where id = p_purchase_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Compra não encontrada' using errcode = 'P0002';
  end if;
  if v_status <> 'pendente' then
    raise exception 'Só é possível receber compras pendentes (status atual: %)', v_status using errcode = '22023';
  end if;

  for v_it in select product_id, quantity, unit_price from public.purchase_items where purchase_id = p_purchase_id
  loop
    perform public._apply_stock_movement(
      v_company, v_it.product_id, 'Compra', v_it.quantity,
      'Compra ' || left(p_purchase_id::text, 8), 'Recebimento de compra'
    );
    update public.products set purchase_price = v_it.unit_price where id = v_it.product_id;
  end loop;

  update public.purchases set status = 'recebida' where id = p_purchase_id;

  if v_total > 0 then
    insert into public.accounts_payable(company_id, supplier_id, purchase_id, description, due_date, amount, status, created_by)
    values (v_company, v_supplier_id, p_purchase_id, 'Compra ' || left(p_purchase_id::text, 8), coalesce(v_purchase_date, current_date) + 30, v_total, 'Aberta', auth.uid());
  end if;
end;
$$;

create or replace function public.cancel_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_status text;
  v_payable public.accounts_payable;
  v_has_payable boolean := false;
  v_it record;
begin
  if not public.user_has_permission('purchases.cancel') then
    raise exception 'Sem permissão para cancelar compras' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select status into v_status from public.purchases
  where id = p_purchase_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Compra não encontrada' using errcode = 'P0002';
  end if;
  if v_status = 'cancelada' then
    raise exception 'Compra já está cancelada' using errcode = '22023';
  end if;

  if v_status = 'recebida' then
    select * into v_payable from public.accounts_payable
    where purchase_id = p_purchase_id
    for update;
    v_has_payable := found;

    if v_has_payable and v_payable.paid_amount > 0 then
      raise exception 'Não é possível cancelar: já há pagamento registrado nesta compra' using errcode = '22023';
    end if;

    for v_it in select product_id, quantity from public.purchase_items where purchase_id = p_purchase_id
    loop
      perform public._apply_stock_movement(
        v_company, v_it.product_id, 'Ajuste', -v_it.quantity,
        'Estorno compra ' || left(p_purchase_id::text, 8), 'Cancelamento de compra recebida'
      );
    end loop;

    if v_has_payable then
      update public.accounts_payable set status = 'Cancelada' where id = v_payable.id;
    end if;
  end if;

  update public.purchases set status = 'cancelada' where id = p_purchase_id;
end;
$$;
