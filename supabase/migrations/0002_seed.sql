-- Adega Cloud — Dados iniciais (empresa modelo, perfis e permissões base)
-- A matriz de permissões completa por módulo será construída na Sprint 03.
-- Aqui criamos apenas o suficiente para o login/dashboard funcionarem de verdade.

insert into public.companies (name, document, email, active)
values ('Adega Modelo', '12.345.678/0001-99', 'contato@adegamodelo.com.br', true)
on conflict do nothing;

insert into public.roles (name, description) values
  ('Administrador', 'Acesso total ao sistema'),
  ('Gerente', 'Acesso operacional completo'),
  ('Financeiro', 'Somente financeiro'),
  ('Caixa', 'Somente vendas e caixa'),
  ('Estoquista', 'Produtos e estoque'),
  ('Vendedor', 'Vendas e clientes')
on conflict (name) do nothing;

insert into public.permissions (name, description) values
  ('dashboard.view', 'Ver dashboard'),
  ('products.view', 'Ver produtos'),
  ('products.create', 'Criar produtos'),
  ('products.edit', 'Editar produtos'),
  ('products.delete', 'Excluir produtos'),
  ('sales.create', 'Realizar vendas'),
  ('cash.manage', 'Gerenciar caixa')
on conflict (name) do nothing;

-- Administrador recebe todas as permissões cadastradas
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'Administrador'
on conflict do nothing;
