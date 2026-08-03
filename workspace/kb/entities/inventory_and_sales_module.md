# Entity: Stock Movement & POS Sales

- **Criticality:** CRITICAL
- **Files:** `src/services/InventoryService.ts`, `src/services/SaleService.ts`, `src/services/PurchaseService.ts`
- **Description:** Handles stock deductions, manual inventory adjustments, purchase receipt increments, and POS sale transactions.
- **Trust Boundary:** Incoming POS sale payload must validate item quantities against active stock before committing.
- **Security Constraints:**
  - `SaleService.create` enforces `current_stock >= item.quantity` and throws exception on insufficient stock.
  - Stock movements register immutable log records in `inventory_movements`.
- **Associated Vulnerabilities:** [CWE-840 Business Logic Flaws](../vulnerabilities/CWE-840_Business_Logic.md), [CWE-362 Race Conditions](../vulnerabilities/CWE-362_Race_Condition.md)
