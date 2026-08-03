# Mantis Security Summary: `src/app/api/users`

## Core Components
- **Files (1):** `route.ts`

## API Endpoints & Exports
- Exposes functions/components in: `route.ts`

## Trust Boundaries & External Inputs
- HTTP API Route handlers receiving incoming request body/params.
- Supabase RLS database queries / RPC procedure calls.
- User authorization and permission checks.

## Sensitive Operations
- User role management, permission assignment, company configuration.

## Historical Vulnerabilities & Fixes
- No historical vulnerability records found in `workspace/historical_learnings.jsonl` for this path.
