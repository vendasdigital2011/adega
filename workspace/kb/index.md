# Adega Cloud — Security Knowledge Base Index

## Architecture
- [System Security Architecture](architecture.md) — System topology, trust boundaries, multi-tenancy, and high-risk components.

## Entities (Components)
- [Authentication & Access Control Module](entities/auth_module.md) — User auth, session tokens, password resets, middleware.
- [Role-Based Access Control (RBAC)](entities/rbac_permissions_module.md) — Permission matrix across 14 modules and 8 action types.
- [Stock Movement & POS Sales](entities/inventory_and_sales_module.md) — Stock ledger, sales validation, purchase receipts.
- [Cash Register & Financial Ledger](entities/financial_and_cash_module.md) — Cash open/close, sangria/suprimento, payables/receivables.

## Vulnerability Classes
- [CWE-285: Improper Authorization](vulnerabilities/CWE-285_Improper_Authorization.md)
- [CWE-862: Missing Authorization](vulnerabilities/CWE-862_Missing_Authorization.md)
- [CWE-840: Business Logic Flaws](vulnerabilities/CWE-840_Business_Logic.md)
- [CWE-287: Improper Authentication](vulnerabilities/CWE-287_Improper_Authentication.md)
