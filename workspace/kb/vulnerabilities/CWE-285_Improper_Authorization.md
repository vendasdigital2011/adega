# CWE-285: Improper Authorization

- **Description:** Occurs when an application does not perform or incorrectly performs authorization checks when an authenticated actor attempts to access a resource or execute an action.
- **Impact in Adega Cloud:** Unauthorized users accessing financial data, cash registers, or modifying system configurations.
- **Mitigation Pattern:** Validate permissions via `usePermission` in UI and enforce RLS policies in Supabase tables.
