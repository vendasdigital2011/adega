# Entity: Cash Register & Financial Ledger

- **Criticality:** CRITICAL
- **Files:** `src/services/CashService.ts`, `src/services/FinancialService.ts`
- **Description:** Controls cash register open/close state, cash movements (sangria/suprimento), accounts payable, and accounts receivable.
- **Trust Boundary:** Money movements require open cash register session and role authorization.
- **Security Constraints:**
  - Automatic cash movements generated on cash sales.
  - Audit log entries recorded for manual cash adjustments.
- **Associated Vulnerabilities:** [CWE-862 Missing Authorization](../vulnerabilities/CWE-862_Missing_Authorization.md)
