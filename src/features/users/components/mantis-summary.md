# Mantis Security Summary: `src/features/users/components`

## Core Components
- **Files (6):** `PermissionMatrix.tsx`, `RoleForm.tsx`, `RoleSelector.tsx`, `UserForm.tsx`, `UserStatusBadge.tsx`, `UserTable.tsx`

## API Endpoints & Exports
- Exposes functions/components in: `PermissionMatrix.tsx`, `RoleForm.tsx`, `RoleSelector.tsx`, `UserForm.tsx`, `UserStatusBadge.tsx`, `UserTable.tsx`

## Trust Boundaries & External Inputs
- Supabase RLS database queries / RPC procedure calls.
- User authorization and permission checks.

## Sensitive Operations
- User role management, permission assignment, company configuration.

## Historical Vulnerabilities & Fixes
- No historical vulnerability records found in `workspace/historical_learnings.jsonl` for this path.
