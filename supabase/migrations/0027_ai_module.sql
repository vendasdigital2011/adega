-- Adega Cloud — Migração 0027: Módulo Inteligência Artificial (IA)
-- Tabelas para armazenar insights, conversas de chat, estatísticas de IA e auditoria de IA.

-- =========================================
-- ai_insights
-- =========================================
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('alert', 'recommendation', 'opportunity', 'risk')),
  category text not null check (category in ('stock', 'purchases', 'sales', 'financial', 'customers')),
  priority text not null check (priority in ('high', 'medium', 'low')),
  title text not null,
  description text not null,
  action_suggestion text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_insights enable row level security;

create policy "Usuários acessam insights da própria empresa" on public.ai_insights
  for all using (
    company_id = (
      select company_id from public.users where id = auth.uid()
    )
  );

-- =========================================
-- ai_chat_conversations
-- =========================================
create table if not exists public.ai_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null default 'Nova Consulta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_chat_conversations enable row level security;

create policy "Usuários acessam conversas de IA da própria empresa" on public.ai_chat_conversations
  for all using (
    company_id = (
      select company_id from public.users where id = auth.uid()
    )
  );

-- =========================================
-- ai_chat_messages
-- =========================================
create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_chat_conversations(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant')),
  message text not null,
  context_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_chat_messages enable row level security;

create policy "Usuários acessam mensagens de suas conversas" on public.ai_chat_messages
  for all using (
    exists (
      select 1 from public.ai_chat_conversations c
      where c.id = ai_chat_messages.conversation_id
      and c.company_id = (
        select company_id from public.users where id = auth.uid()
      )
    )
  );

-- =========================================
-- ai_audit_logs
-- =========================================
create table if not exists public.ai_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  action_type text not null check (action_type in ('query', 'insight_accepted', 'insight_dismissed', 'report_generated')),
  prompt_summary text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_audit_logs enable row level security;

create policy "Usuários acessam logs de auditoria da IA da própria empresa" on public.ai_audit_logs
  for all using (
    company_id = (
      select company_id from public.users where id = auth.uid()
    )
  );

-- Índices de performance
create index if not exists idx_ai_insights_company_status on public.ai_insights(company_id, status);
create index if not exists idx_ai_insights_created_at on public.ai_insights(created_at desc);
create index if not exists idx_ai_chat_messages_conversation on public.ai_chat_messages(conversation_id, created_at);
create index if not exists idx_ai_audit_logs_company on public.ai_audit_logs(company_id, created_at desc);
