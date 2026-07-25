-- Auditoria "reviravolta" — Etapa 4 (achado P6): cliente não tinha nenhum
-- limite de crédito — venda Fiado (Sprint 14) gerava conta a receber sem
-- teto algum, cliente podia acumular dívida infinita. NULL = sem limite,
-- mesmo padrão de roles.discount_limit_percent (Etapa 1).
--
-- (P5 — falha de login auditável — não precisou de migration: não dá pra
-- gravar em audit_logs sem company_id, que não existe numa falha de login;
-- resolvido só em código, dando uma action própria e filtrável no logger.)

alter table public.customers add column if not exists credit_limit numeric(12,2);

comment on column public.customers.credit_limit is
  'Limite de crédito para vendas Fiado — saldo em aberto (Aberta/Parcial) + a nova venda não pode ultrapassar. NULL = sem limite.';

-- =========================================
-- create_sale (substitui 0021) — mantém preço do catálogo e limite de
-- desconto por perfil; adiciona checagem de limite de crédito do cliente
-- antes de confirmar uma venda Fiado.
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
  v_credit_limit numeric(12,2);
  v_outstanding numeric(12,2);
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

  if p_payment_method = 'Fiado' then
    select credit_limit into v_credit_limit from public.customers where id = p_customer_id;
    if v_credit_limit is not null then
      select coalesce(sum(amount - received_amount), 0) into v_outstanding
      from public.accounts_receivable
      where customer_id = p_customer_id and status in ('Aberta', 'Parcial');

      if v_outstanding + v_total > v_credit_limit then
        raise exception 'Limite de crédito excedido: saldo em aberto % + esta venda % ultrapassa o limite de %',
          to_char(v_outstanding, 'FM999999990.00'),
          to_char(v_total, 'FM999999990.00'),
          to_char(v_credit_limit, 'FM999999990.00')
          using errcode = '55000';
      end if;
    end if;
  end if;

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
