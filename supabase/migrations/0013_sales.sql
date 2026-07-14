-- Adega Cloud — Sprint 12: Vendas
-- Venda (cabeçalho) + itens. A venda nasce FINALIZADA (PDV): ao criar, dá baixa
-- no estoque (movimento 'Venda'). Cancelar estorna o estoque (movimento
-- 'Entrada'). Cliente é opcional (venda de balcão). Movimentação financeira e
-- vínculo com caixa ficam para as Sprints 13/14. Estoque negativo é bloqueado
-- pelo núcleo _apply_stock_movement.

-- =========================================
-- Tabelas
-- =========================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  sale_date date not null default current_date,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null,
  status text not null default 'finalizada',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sales drop constraint if exists sales_status_check;
alter table public.sales add constraint sales_status_check
  check (status in ('finalizada','cancelada'));

alter table public.sales drop constraint if exists sales_payment_method_check;
alter table public.sales add constraint sales_payment_method_check
  check (payment_method in ('Dinheiro','PIX','Cartão de Débito','Cartão de Crédito'));

create index if not exists idx_sales_company_id on public.sales(company_id);
create index if not exists idx_sales_customer_id on public.sales(customer_id);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null
);

create index if not exists idx_sale_items_sale_id on public.sale_items(sale_id);
create index if not exists idx_sale_items_product_id on public.sale_items(product_id);

-- =========================================
-- RLS: leitura por empresa/permissão. Escrita só via as funções.
-- =========================================
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists "sales_select_same_company" on public.sales;
create policy "sales_select_same_company" on public.sales
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('sales.view')
  );

drop policy if exists "sale_items_select_same_company" on public.sale_items;
create policy "sale_items_select_same_company" on public.sale_items
  for select using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and s.company_id = public.current_user_company_id()
        and public.user_has_permission('sales.view')
    )
  );

-- =========================================
-- Criar venda (finaliza na hora): baixa estoque de cada item. Atômico —
-- se faltar estoque em qualquer item, a venda inteira falha.
-- p_items: jsonb array de { product_id, quantity, unit_price }.
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
  v_sale_id uuid;
  v_subtotal numeric(12,2) := 0;
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

    -- Baixa de estoque (bloqueia se ficaria negativo).
    perform public._apply_stock_movement(
      v_company, (v_item->>'product_id')::uuid, 'Venda', v_qty,
      'Venda ' || left(v_sale_id::text, 8), 'Baixa por venda'
    );
  end loop;

  update public.sales
  set subtotal = v_subtotal, total = v_subtotal - coalesce(p_discount,0)
  where id = v_sale_id;

  return v_sale_id;
end;
$$;

-- =========================================
-- Cancelar venda: estorna o estoque (devolve as quantidades) e marca cancelada.
-- =========================================
create or replace function public.cancel_sale(p_sale_id uuid)
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
  if not public.user_has_permission('sales.cancel') then
    raise exception 'Sem permissão para cancelar vendas' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select status into v_status from public.sales
  where id = p_sale_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Venda não encontrada' using errcode = 'P0002';
  end if;
  if v_status = 'cancelada' then
    raise exception 'Venda já está cancelada' using errcode = '22023';
  end if;

  for v_it in select product_id, quantity from public.sale_items where sale_id = p_sale_id
  loop
    perform public._apply_stock_movement(
      v_company, v_it.product_id, 'Entrada', v_it.quantity,
      'Estorno venda ' || left(p_sale_id::text, 8), 'Cancelamento de venda'
    );
  end loop;

  update public.sales set status = 'cancelada' where id = p_sale_id;
end;
$$;
