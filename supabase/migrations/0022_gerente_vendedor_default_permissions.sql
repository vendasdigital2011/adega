-- Auditoria "reviravolta" — Etapa 3 (achado P4): a matriz de permissões
-- granular já existia desde a Sprint 03, mas o papel Gerente nunca recebeu
-- nenhuma permissão por padrão (seed original só concede tudo pro
-- Administrador) e o Vendedor tinha só um punhado de grants avulsos,
-- incluindo um que não devia estar lá (cash.approve — ver abaixo).
--
-- Decisão de negócio, definida com o dono: Gerente é o operacional
-- completo da loja (cadastro, estoque, compras, vendas, caixa, financeiro
-- de consulta/lançamento) mas não mexe em configurações, não vê auditoria,
-- não cria/edita usuários e não aprova pagamento/recebimento sozinho —
-- essas quatro ficam só com o Administrador. Vendedor é só o necessário
-- pro balcão: vender, cadastrar cliente, consultar estoque, abrir/operar
-- o próprio caixa. Sangria/suprimento (cash.create) e fechar caixa
-- (cash.approve) ficam reservados pro Gerente — negócio de bebidas lida
-- com bastante dinheiro em espécie, retirada de caixa passa por alguém
-- de confiança, não pelo balconista.

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Gerente'
  and p.name in (
    'dashboard.view',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'brands.view', 'brands.create', 'brands.edit', 'brands.delete',
    'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.export', 'suppliers.import',
    'customers.view', 'customers.create', 'customers.edit', 'customers.export', 'customers.import',
    'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.approve',
    'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.cancel',
    'sales.view', 'sales.create', 'sales.cancel', 'sales.export',
    'cash.view', 'cash.manage', 'cash.create', 'cash.approve',
    'financial.view', 'financial.create', 'financial.edit',
    'reports.view', 'reports.export'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Vendedor'
  and p.name in (
    'dashboard.view',
    'products.view',
    'customers.view', 'customers.create', 'customers.edit',
    'inventory.view',
    'sales.create', 'sales.view',
    'cash.manage', 'cash.view'
  )
on conflict do nothing;

-- Vendedor tinha cash.approve (aprovar/fechar caixa) concedido — não bate
-- com a decisão acima (fechamento é ação de supervisor). Remove.
delete from public.role_permissions
where role_id = (select id from public.roles where name = 'Vendedor')
  and permission_id = (select id from public.permissions where name = 'cash.approve');
