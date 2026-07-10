-- Adega Cloud — Sprint 10: Estoque (movimentações)
-- Ledger imutável de movimentações. A fonte de verdade do saldo é
-- products.current_stock; a tabela inventory_movements é o histórico
-- append-only (regra: "Nenhuma movimentação poderá ser excluída").
-- A tabela `inventory`/location do doc de banco (multi-depósito) fica para o
-- futuro — hoje o saldo único vive em products.current_stock.

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null,
  quantity integer not null,
  previous_quantity integer not null,
  current_quantity integer not null,
  reference text,
  observation text,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.inventory_movements drop constraint if exists inventory_movements_type_check;
alter table public.inventory_movements add constraint inventory_movements_type_check
  check (movement_type in ('Entrada','Saída','Venda','Compra','Ajuste','Inventário','Perda','Quebra'));

create index if not exists idx_inv_mov_company_id on public.inventory_movements(company_id);
create index if not exists idx_inv_mov_product_id on public.inventory_movements(product_id);
create index if not exists idx_inv_mov_created_at on public.inventory_movements(created_at);

-- =========================================
-- RLS: apenas leitura (ledger imutável). Inserção só via a função abaixo.
-- Sem policies de update/delete → RLS nega por padrão, garantindo imutabilidade.
-- =========================================
alter table public.inventory_movements enable row level security;

drop policy if exists "inv_mov_select_same_company" on public.inventory_movements;
create policy "inv_mov_select_same_company" on public.inventory_movements
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('inventory.view')
  );

-- =========================================
-- Função atômica de movimentação de estoque.
-- Trava a linha do produto (FOR UPDATE), calcula o novo saldo conforme o tipo,
-- impede saldo negativo, grava o movimento e atualiza products.current_stock —
-- tudo em uma única transação. SECURITY DEFINER para poder atualizar o produto
-- mesmo que o papel do usuário não tenha products.edit; a permissão exigida é
-- inventory.create.
-- =========================================
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
declare
  v_company uuid;
  v_prev integer;
  v_new integer;
  v_row public.inventory_movements;
begin
  if not public.user_has_permission('inventory.create') then
    raise exception 'Sem permissão para movimentar estoque' using errcode = '42501';
  end if;

  v_company := public.current_user_company_id();

  select current_stock into v_prev
  from public.products
  where id = p_product_id and company_id = v_company
  for update;

  if not found then
    raise exception 'Produto não encontrado nesta empresa' using errcode = 'P0002';
  end if;

  if p_movement_type in ('Entrada','Compra') then
    v_new := v_prev + abs(p_quantity);
  elsif p_movement_type in ('Saída','Venda','Perda','Quebra') then
    v_new := v_prev - abs(p_quantity);
  elsif p_movement_type = 'Ajuste' then
    v_new := v_prev + p_quantity; -- ajuste pode ser positivo ou negativo
  elsif p_movement_type = 'Inventário' then
    v_new := abs(p_quantity); -- inventário define o saldo absoluto contado
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
    v_company, p_product_id, p_movement_type, p_quantity,
    v_prev, v_new, p_reference, p_observation, auth.uid()
  ) returning * into v_row;

  update public.products set current_stock = v_new where id = p_product_id;

  return v_row;
end;
$$;
