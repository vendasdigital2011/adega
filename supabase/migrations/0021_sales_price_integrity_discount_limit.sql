-- Auditoria "reviravolta" (2026-07-21) — Etapa 1: fecha duas falhas críticas
-- encontradas em create_sale (achados P1 e P2):
--
-- P1: o preço de cada item vinha de `p_items->>'unit_price'`, enviado pelo
-- CHAMADOR — qualquer usuário com sales.create podia chamar a RPC direto
-- (fora da UI) com um preço arbitrário (ex.: 0,01 num produto de 150 reais).
-- NAO usar o símbolo de cifrão em comentários deste arquivo: o separador de
-- statements do SQL Editor do Supabase pareia cifrões soltos como se fossem
-- dollar-quoting e desalinha os delimitadores das funções abaixo.
-- Agora o preço é sempre resolvido no servidor a partir de public.products
-- (promotion_price quando definido, senão sale_price); o valor enviado pelo
-- cliente deixa de ser lido.
--
-- P2: o desconto não tinha teto algum. Agora cada perfil (roles) pode ter um
-- discount_limit_percent — NULL significa sem limite (Administrador/Gerente,
-- conforme decidido com o usuário); Vendedor fica limitado a 10%.

alter table public.roles add column if not exists discount_limit_percent numeric(5,2);

comment on column public.roles.discount_limit_percent is
  'Percentual máximo de desconto (0-100) que um usuário deste perfil pode aplicar numa venda. NULL = sem limite.';

update public.roles set discount_limit_percent = 10 where name = 'Vendedor';

create or replace function public.current_user_discount_limit_percent()
returns numeric as $limitfn$
  select r.discount_limit_percent
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid()
$limitfn$ language sql stable security definer set search_path = public;

-- =========================================
-- create_sale (substitui 0015) — preço vem do catálogo, desconto respeita o
-- limite do perfil. Mantém integralmente a lógica de caixa/Fiado de 0014/0015.
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
as $salefn$
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
  v_discount numeric(12,2);
  v_limit numeric;
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

  v_discount := coalesce(p_discount, 0);
  if v_discount < 0 then
    raise exception 'Desconto não pode ser negativo' using errcode = '22023';
  end if;

  insert into public.sales(company_id, customer_id, sale_date, subtotal, discount, total, payment_method, status, created_by)
  values (v_company, p_customer_id, coalesce(p_sale_date, current_date), 0, v_discount, 0, p_payment_method, 'finalizada', auth.uid())
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantidade do item deve ser maior que zero' using errcode = '22023';
    end if;

    -- Reset explícito: sem isso, um product_id inválido na 2ª+ iteração
    -- herdaria o v_price da iteração anterior (gotcha clássico de plpgsql
    -- com "select ... into" quando a consulta não retorna linha).
    v_price := null;
    select coalesce(promotion_price, sale_price) into v_price
    from public.products
    where id = (v_item->>'product_id')::uuid and company_id = v_company;

    if v_price is null then
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

  if v_discount > v_subtotal then
    raise exception 'Desconto não pode ser maior que o subtotal da venda' using errcode = '22023';
  end if;

  v_limit := public.current_user_discount_limit_percent();
  if v_limit is not null and v_subtotal > 0 and (v_discount / v_subtotal * 100) > v_limit then
    raise exception 'Desconto de % excede o limite do seu perfil (máx. %)',
      round(v_discount / v_subtotal * 100, 1)::text || '%',
      v_limit::text || '%'
      using errcode = '42501';
  end if;

  v_total := v_subtotal - v_discount;

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
$salefn$;
