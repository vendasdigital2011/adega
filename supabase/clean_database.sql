-- ==============================================================================
-- SCRIPT DE LIMPEZA E ZERAMENTO DO BANCO DE DADOS (PREPARAÇÃO PARA ENTREGA DO CLIENTE)
-- ==============================================================================
-- ATENÇÃO: Execute este script no SQL Editor do Supabase se desejar zerar todas
-- as movimentações de teste (vendas, caixa, estoque, financeiro, compras e cadastros).
-- As tabelas de perfis (roles) e permissões (permissions) SERÃO PRESERVADAS.

-- 1. Limpeza de movimentações de vendas e caixa
TRUNCATE TABLE public.sale_items CASCADE;
TRUNCATE TABLE public.sales CASCADE;
TRUNCATE TABLE public.cash_movements CASCADE;
TRUNCATE TABLE public.cash_registers CASCADE;

-- 2. Limpeza de compras e movimentações de estoque
TRUNCATE TABLE public.purchase_items CASCADE;
TRUNCATE TABLE public.purchases CASCADE;
TRUNCATE TABLE public.stock_movements CASCADE;

-- 3. Limpeza do financeiro
TRUNCATE TABLE public.accounts_payable CASCADE;
TRUNCATE TABLE public.accounts_receivable CASCADE;
TRUNCATE TABLE public.cost_centers CASCADE;

-- 4. Limpeza do catálogo de produtos e cadastros base
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.brands CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.suppliers CASCADE;

-- 5. Limpeza de logs de auditoria e notificações
TRUNCATE TABLE public.audit_logs CASCADE;
TRUNCATE TABLE public.notifications CASCADE;

-- Nota: Para apagar usuários de teste da tabela public.users mantendo apenas os administradores reais:
-- DELETE FROM public.users WHERE email LIKE '%teste%' OR name LIKE '%Teste%';
