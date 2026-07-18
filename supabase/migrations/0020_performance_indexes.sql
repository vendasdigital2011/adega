-- Adega Cloud — Sprint 19: Otimização (SQL)
-- Índices para as colunas mais filtradas/ordenadas que ainda não tinham um
-- (auditadas em src/services/*.ts): status e datas usadas em Dashboard,
-- Relatórios, Financeiro e nas listagens padrão (order by created_at desc).
-- company_id de cada tabela já está indexado desde a migration original —
-- isso complementa, não substitui, já que RLS sempre filtra por company_id
-- primeiro e o planner combina os índices via bitmap scan quando precisa.

create index if not exists idx_sales_sale_date on public.sales(sale_date);
create index if not exists idx_sales_status on public.sales(status);
create index if not exists idx_sales_created_at on public.sales(created_at);

create index if not exists idx_purchases_purchase_date on public.purchases(purchase_date);
create index if not exists idx_purchases_status on public.purchases(status);
create index if not exists idx_purchases_created_at on public.purchases(created_at);

create index if not exists idx_accounts_receivable_due_date on public.accounts_receivable(due_date);
create index if not exists idx_accounts_receivable_status on public.accounts_receivable(status);

create index if not exists idx_accounts_payable_due_date on public.accounts_payable(due_date);
create index if not exists idx_accounts_payable_status on public.accounts_payable(status);

create index if not exists idx_receivable_receipts_received_at on public.receivable_receipts(received_at);
create index if not exists idx_payable_payments_paid_at on public.payable_payments(paid_at);

create index if not exists idx_cash_registers_status on public.cash_registers(status);
create index if not exists idx_cash_registers_opened_at on public.cash_registers(opened_at);

create index if not exists idx_users_status on public.users(status);
