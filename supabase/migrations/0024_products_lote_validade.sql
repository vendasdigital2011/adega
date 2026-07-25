-- Etapa 7 (P9 do audit): adiciona campos lote/validade em products
-- Ambos opcionais (NULL = produto não tem controle de lote/validade).
-- Validade é date, não timestamp — permite comparação simples pra alertas de vencimento.

alter table public.products
add column batch_number text,
add column expiry_date date;

-- Índice opcional em expiry_date para queries de "produtos vencidos" futuras
-- (ainda não há views/alerts implementados; este é preparatório).
create index idx_products_expiry_date on public.products(company_id, expiry_date)
where expiry_date is not null;

-- Sem RLS policy change necessária — os policies existentes em products.* já cobrem.
-- Sem trigger necessário — não há validação de regra de negócio (outros campos históricos
-- podem ter sido deletados sem rebuild, lote/validade seguem o mesmo padrão).
