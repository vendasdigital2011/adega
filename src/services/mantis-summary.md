# Mantis Security Summary: `src/services`

## Core Components
- **Files (25):** `AccountsPayableService.ts`, `AccountsReceivableService.ts`, `AIService.ts`, `AuditService.ts`, `AuthService.ts`, `BaseService.ts`, `BrandService.ts`, `CashService.ts`, `CategoryService.ts`, `CostCenterService.ts`, `CustomerService.ts`, `DashboardService.ts`, `FinancialService.ts`, `InventoryService.ts`, `KeyboardShortcutService.ts`, `NotificationService.ts`, `PermissionService.ts`, `ProductService.ts`, `PurchaseService.ts`, `ReportService.ts`, `RoleService.ts`, `SaleService.ts`, `SettingsService.ts`, `SupplierService.ts`, `UserService.ts`
- **Subdirectories (1):** `cache/`

## API Endpoints & Exports
- Exposes functions/components in: `AccountsPayableService.ts`, `AccountsReceivableService.ts`, `AIService.ts`, `AuditService.ts`, `AuthService.ts`, `BaseService.ts`, `BrandService.ts`, `CashService.ts`, `CategoryService.ts`, `CostCenterService.ts`

## Trust Boundaries & External Inputs
- HTTP API Route handlers receiving incoming request body/params.
- Supabase RLS database queries / RPC procedure calls.
- User authorization and permission checks.

## Sensitive Operations
- Authentication, password hashing, JWT token validation, session management.

## Historical Vulnerabilities & Fixes
- No historical vulnerability records found in `workspace/historical_learnings.jsonl` for this path.
