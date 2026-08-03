# Mantis Security Summary: `src`

## Core Components
- **Files (1):** `middleware.ts`
- **Subdirectories (10):** `app/`, `components/`, `features/`, `hooks/`, `lib/`, `providers/`, `schemas/`, `services/`, `types/`, `utils/`

## API Endpoints & Exports
- Exposes functions/components in: `middleware.ts`

## Trust Boundaries & External Inputs
- HTTP API Route handlers receiving incoming request body/params.
- Supabase RLS database queries / RPC procedure calls.
- User authorization and permission checks.

## Sensitive Operations
- Standard UI rendering and state management.

## Historical Vulnerabilities & Fixes
- No historical vulnerability records found in `workspace/historical_learnings.jsonl` for this path.
