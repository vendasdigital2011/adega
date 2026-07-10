-- Adega Cloud — Sprint 09: Produtos
-- Tabela de produtos, multi-tenant. Referencia categoria (obrigatória), marca e
-- fornecedor (opcionais). SKU único por empresa. Exclusão lógica (active).
-- RLS orientada às permissões products.* (já semeadas em 0002).

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid references public.brands(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  description text,
  unit text,
  purchase_price numeric(12,2),
  sale_price numeric(12,2) not null default 0,
  wholesale_price numeric(12,2),
  promotion_price numeric(12,2),
  minimum_stock integer not null default 0,
  current_stock integer not null default 0,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_company_id on public.products(company_id);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_brand_id on public.products(brand_id);
create index if not exists idx_products_supplier_id on public.products(supplier_id);

-- SKU único por empresa (regra: "Não será permitido cadastrar dois produtos com o mesmo SKU")
alter table public.products drop constraint if exists products_sku_company_unique;
alter table public.products add constraint products_sku_company_unique unique (company_id, sku);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- =========================================
-- RLS
-- =========================================
alter table public.products enable row level security;

drop policy if exists "products_select_same_company" on public.products;
create policy "products_select_same_company" on public.products
  for select using (
    company_id = public.current_user_company_id()
    and public.user_has_permission('products.view')
  );

drop policy if exists "products_insert_with_permission" on public.products;
create policy "products_insert_with_permission" on public.products
  for insert with check (
    company_id = public.current_user_company_id()
    and public.user_has_permission('products.create')
  );

-- Edição inclui exclusão lógica (active) e ajustes de cadastro. Movimentação de
-- estoque (current_stock) será tratada pelo módulo de Estoque na Sprint 10.
drop policy if exists "products_update_with_permission" on public.products;
create policy "products_update_with_permission" on public.products
  for update using (
    company_id = public.current_user_company_id()
    and (public.user_has_permission('products.edit') or public.user_has_permission('products.delete'))
  );
