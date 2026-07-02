-- Adega Cloud — Vincula o usuário de teste criado no Supabase Auth ao perfil Administrador
-- Rode isso DEPOIS de criar o usuário em Authentication > Users no dashboard do Supabase.

insert into public.users (id, company_id, role_id, name, email, active)
values (
  'f6928173-b3e0-49ec-bc8f-9d00b46acaa6',
  (select id from public.companies where name = 'Adega Modelo'),
  (select id from public.roles where name = 'Administrador'),
  'Administrador Teste',
  'teste@teste.com',
  true
)
on conflict (id) do update set
  company_id = excluded.company_id,
  role_id = excluded.role_id,
  name = excluded.name,
  email = excluded.email,
  active = excluded.active;
