# Entity: Role-Based Access Control (RBAC)

- **Criticality:** CRITICAL
- **Files:** `src/services/PermissionService.ts`, `src/services/RoleService.ts`, `src/features/settings/components/PermissionsManager.tsx`, `src/hooks/usePermission.ts`
- **Description:** Controls permission grants across 14 modules and 8 granular action types per role.
- **Trust Boundary:** Frontend UI controls visibility; backend RLS policies and RPC checks enforce database-level access.
- **Security Constraints:**
  - Admin settings allow toggling permissions per role.
  - In demo/offline mode, mock permissions fallback must strictly restrict unauthorized roles.
- **Associated Vulnerabilities:** [CWE-285 Improper Authorization](../vulnerabilities/CWE-285_Improper_Authorization.md), [CWE-862 Missing Authorization](../vulnerabilities/CWE-862_Missing_Authorization.md)
