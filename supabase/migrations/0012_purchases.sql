-- Adega Cloud — Sprint 11: Compras
-- Compra (cabeçalho) + itens. Fluxo de status: pendente → recebida → cancelada.
-- Ao RECEBER, cada item gera uma movimentação de estoque tipo 'Compra' (entrada)
-- e atualiza o custo do produto. Ao CANCELAR uma compra recebida, o estoque é
-- estornado. Tudo via funções atômicas. A movimentação FINANCEIRA fica para a
-- Sprint 14 (módulo Financeiro ainda não existe).

-- =========================================
-- Tabelas
-- =========================================
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  purchase_date date not null default current_date,
  freight numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pendente',
  notes text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.purchases drop constraint if exists purchases_status_check;
alter table public.purchases add constraint purchases_status_check
  check (status in ('pendente','recebida','cancelada'));

create index if not exists idx_purchases_company_id on public.purchases(company_id);
create index if not exists idx_purchases_supplier_id on public.purchases(supplier_id);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null
);

create index if not exists idx_purchase_items_purchase_id on public.purchase_items(purchase_id);
create index if not exists idx_purchase_items_product_id on public.purchase_items(product_id);

-- =========================================
-- RLS: leitura por empresa/permissão. Escrita somente via as funções abaixo.
-- =========================================
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;

drop policy if exists "purchases_select_same_company" on public.purchases;
create policy "purchases_select_same_company" on public.purchases
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('purchases.view')
  );

drop policy if exists "purchase_items_select_same_company" on public.purchase_items;
create policy "purchase_items_select_same_company" on public.purchase_items
  for select using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_items.purchase_id
        and p.company_id = public.current_user_company_id()
        and public.user_has_permission('purchases.view')
    )
  );

-- =========================================
-- Núcleo de movimentação de estoque (sem checagem de permissão).
-- Reutilizado por register_inventory_movement e pelas funções de compra.
-- =========================================
create or replace function public._apply_stock_movement(
  p_company uuid,
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_reference text default null,
  p_observation text default null
) returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev integer;
  v_new integer;
  v_row public.inventory_movements;
begin
  select current_stock into v_prev
  from public.products
  where id = p_product_id and company_id = p_company
  for update;

  if not found then
    raise exception 'Produto não encontrado nesta empresa' using errcode = 'P0002';
  end if;

  if p_movement_type in ('Entrada','Compra') then
    v_new := v_prev + abs(p_quantity);
  elsif p_movement_type in ('Saída','Venda','Perda','Quebra') then
    v_new := v_prev - abs(p_quantity);
  elsif p_movement_type = 'Ajuste' then
    v_new := v_prev + p_quantity;
  elsif p_movement_type = 'Inventário' then
    v_new := abs(p_quantity);
  else
    raise exception 'Tipo de movimentação inválido: %', p_movement_type using errcode = '22023';
  end if;

  if v_new < 0 then
    raise exception 'Estoque não pode ficar negativo (saldo atual %, resultaria em %)', v_prev, v_new
      using errcode = '23514';
  end if;

  insert into public.inventory_movements(
    company_id, product_id, movement_type, quantity,
    previous_quantity, current_quantity, reference, observation, user_id
  ) values (
    p_company, p_product_id, p_movement_type, p_quantity,
    v_prev, v_new, p_reference, p_observation, auth.uid()
  ) returning * into v_row;

  update public.products set current_stock = v_new where id = p_product_id;
  return v_row;
end;
$$;

-- Movimentação manual continua exigindo inventory.create; agora delega ao núcleo.
create or replace function public.register_inventory_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_reference text default null,
  p_observation text default null
) returns public.inventory_movements
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_permission('inventory.create') then
    raise exception 'Sem permissão para movimentar estoque' using errcode = '42501';
  end if;
  return public._apply_stock_movement(
    public.current_user_company_id(), p_product_id, p_movement_type, p_quantity, p_reference, p_observation
  );
end;
$$;

-- =========================================
-- Criar compra (cabeçalho + itens) atomicamente. Status inicial: pendente.
-- p_items: jsonb array de { product_id, quantity, unit_price }.
-- =========================================
create or replace function public.create_purchase(
  p_supplier_id uuid,
  p_purchase_date date,
  p_freight numeric,
  p_discount numeric,
  p_notes text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_purchase_id uuid;
  v_items_total numeric(12,2) := 0;
  v_item jsonb;
  v_qty integer;
  v_price numeric(12,2);
  v_line numeric(12,2);
begin
  if not public.user_has_permission('purchases.create') then
    raise exception 'Sem permissão para criar compras' using errcode = '42501';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'A compra deve ter ao menos um item' using errcode = '22023';
  end if;

  v_company := public.current_user_company_id();

  if not exists (select 1 from public.suppliers where id = p_supplier_id and company_id = v_company) then
    raise exception 'Fornecedor inválido' using errcode = 'P0002';
  end if;

  insert into public.purchases(company_id, supplier_id, purchase_date, freight, discount, total, status, notes, created_by)
  values (v_company, p_supplier_id, coalesce(p_purchase_date, current_date), coalesce(p_freight,0), coalesce(p_discount,0), 0, 'pendente', p_notes, auth.uid())
  returning id into v_purchase_id;

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
    v_items_total := v_items_total + v_line;
    insert into public.purchase_items(purchase_id, product_id, quantity, unit_price, total)
    values (v_purchase_id, (v_item->>'product_id')::uuid, v_qty, v_price, v_line);
  end loop;

  update public.purchases
  set total = v_items_total + coalesce(p_freight,0) - coalesce(p_discount,0)
  where id = v_purchase_id;

  return v_purchase_id;
end;
$$;

-- =========================================
-- Receber compra: pendente → recebida. Dá entrada no estoque (tipo 'Compra')
-- e atualiza o custo (purchase_price) de cada produto. Atômico.
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
  v_it record;
begin
  if not public.user_has_permission('purchases.approve') then
    raise exception 'Sem permissão para receber compras' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select status into v_status from public.purchases
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
end;
$$;

-- =========================================
-- Cancelar compra. Se estava 'recebida', estorna o estoque (Ajuste negativo).
-- =========================================
create or replace function public.cancel_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_status text;
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
    for v_it in select product_id, quantity from public.purchase_items where purchase_id = p_purchase_id
    loop
      perform public._apply_stock_movement(
        v_company, v_it.product_id, 'Ajuste', -v_it.quantity,
        'Estorno compra ' || left(p_purchase_id::text, 8), 'Cancelamento de compra recebida'
      );
    end loop;
  end if;

  update public.purchases set status = 'cancelada' where id = p_purchase_id;
end;
$$;
