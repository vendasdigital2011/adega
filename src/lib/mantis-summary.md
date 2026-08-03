# Mantis Security Summary: `src/lib`

## Core Components
- **Files (5):** `logger.ts`, `redis.ts`, `supabase-admin.ts`, `supabase.ts`, `utils.ts`

## API Endpoints & Exports
- Exposes functions/components in: `logger.ts`, `redis.ts`, `supabase-admin.ts`, `supabase.ts`, `utils.ts`

## Trust Boundaries & External Inputs
- Supabase RLS database queries / RPC procedure calls.
- User authorization and permission checks.

## Sensitive Operations
- Standard UI rendering and state management.

## Historical Vulnerabilities & Fixes
- No historical vulnerability records found in `workspace/historical_learnings.jsonl` for this path.
