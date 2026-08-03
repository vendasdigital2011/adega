import os
import json
import re
from pathlib import Path

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
KB_DIR = WORKSPACE / "kb"
ENTITIES_DIR = KB_DIR / "entities"
VULN_DIR = KB_DIR / "vulnerabilities"
ARCHIVE_KB_DIR = WORKSPACE / "archive" / "kb" / "kb_pass_1_1"
ARCHIVE_LEARNINGS_DIR = WORKSPACE / "archive" / "learnings"

KB_DIR.mkdir(parents=True, exist_ok=True)
ENTITIES_DIR.mkdir(parents=True, exist_ok=True)
VULN_DIR.mkdir(parents=True, exist_ok=True)
ARCHIVE_KB_DIR.mkdir(parents=True, exist_ok=True)
ARCHIVE_LEARNINGS_DIR.mkdir(parents=True, exist_ok=True)

# 1. Dependency Analysis (Extract imports from src/)
SRC_DIR = ROOT / "src"
dependencies = {}

import_regex = re.compile(r'(?:import|export)\s+.*?\s+from\s+[\'"]([@\.\/][^\'"]+)[\'"]')

for root, _, files in os.walk(SRC_DIR):
    for f in files:
        if f.endswith((".ts", ".tsx", ".js", ".jsx")):
            file_path = Path(root) / f
            rel_file = file_path.relative_to(ROOT).as_posix()
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                matches = import_regex.findall(content)
                imported_files = []
                for m in matches:
                    if m.startswith("@/"):
                        target_rel = "src/" + m[2:]
                        imported_files.append(target_rel)
                    elif m.startswith("."):
                        target_path = (file_path.parent / m).resolve()
                        try:
                            target_rel = target_path.relative_to(ROOT).as_posix()
                            imported_files.append(target_rel)
                        except ValueError:
                            pass
                dependencies[rel_file] = imported_files
            except Exception:
                pass

dep_json_path = KB_DIR / "dependencies.json"
dep_json_path.write_text(json.dumps(dependencies, indent=2), encoding="utf-8")
print(f"Written dependencies.json ({len(dependencies)} files indexed)")

# 2. Write architecture.md
arch_content = """# Adega Cloud — System Security Architecture

## Overview & System Topology
Adega Cloud is a multi-tenant commercial ERP/POS web application built with **Next.js 15 (App Router)**, **React**, **Tailwind CSS**, and **Supabase (PostgreSQL + RLS + Auth)**.

- **Frontend Core**: Client-side React components and App Router pages under `src/app/` and `src/features/`.
- **Backend / Database Layer**: Supabase PostgreSQL database utilizing Row Level Security (RLS) policies, Stored Procedures / RPCs for atomic operations (stock adjustments, sale completions, cash register operations).
- **Offline / Fallback Layer**: LocalStorage / IndexedDB mock store fallback (`BaseService.getLocalMockStore`) active in demo/offline mode or during unauthenticated test environments.

## Trust Boundaries & Data Flow
1. **Client / Browser Boundary**: User inputs are submitted via forms (React Hook Form + Zod schema validation).
2. **API & Service Layer Boundary**: Service classes under `src/services/` wrap Supabase queries and local fallback logic.
3. **Database & RLS Boundary**: Supabase RLS enforces multi-tenancy (`company_id`) and user-level or role-level table permissions.
4. **Role & Permission Boundary**: Checked via `usePermission` hooks and `PermissionService`.

## High-Risk Critical Components
- **Auth & Session Management**: `src/features/auth`, `AuthService`, `middleware.ts`.
- **Inventory & Stock Ledger**: `InventoryService`, `PurchaseService`, `SaleService`.
- **Financial & Cash Register**: `CashService`, `FinancialService`.
- **Role-Based Access Control (RBAC)**: `PermissionService`, `RoleService`, `PermissionMatrix`.
"""

(KB_DIR / "architecture.md").write_text(arch_content, encoding="utf-8")

# 3. Write Entity Documents under entities/

# Entity 1: auth_module.md
(ENTITIES_DIR / "auth_module.md").write_text("""# Entity: Authentication & Access Control

- **Criticality:** CRITICAL
- **Files:** `src/features/auth/`, `src/services/AuthService.ts`, `src/middleware.ts`
- **Description:** Manages user authentication, session tokens, password resets, and route protection middleware.
- **Trust Boundary:** Validates credentials against Supabase Auth. Protected routes require active session cookies/JWT.
- **Security Constraints:**
  - Password inputs validated via Zod schemas.
  - Route guards in `middleware.ts` redirect unauthenticated traffic away from `/(admin)`.
- **Associated Vulnerabilities:** [CWE-287 Authentication Bypass](../vulnerabilities/CWE-287_Improper_Authentication.md)
""", encoding="utf-8")

# Entity 2: rbac_permissions_module.md
(ENTITIES_DIR / "rbac_permissions_module.md").write_text("""# Entity: Role-Based Access Control (RBAC)

- **Criticality:** CRITICAL
- **Files:** `src/services/PermissionService.ts`, `src/services/RoleService.ts`, `src/features/settings/components/PermissionsManager.tsx`, `src/hooks/usePermission.ts`
- **Description:** Controls permission grants across 14 modules and 8 granular action types per role.
- **Trust Boundary:** Frontend UI controls visibility; backend RLS policies and RPC checks enforce database-level access.
- **Security Constraints:**
  - Admin settings allow toggling permissions per role.
  - In demo/offline mode, mock permissions fallback must strictly restrict unauthorized roles.
- **Associated Vulnerabilities:** [CWE-285 Improper Authorization](../vulnerabilities/CWE-285_Improper_Authorization.md), [CWE-862 Missing Authorization](../vulnerabilities/CWE-862_Missing_Authorization.md)
""", encoding="utf-8")

# Entity 3: inventory_and_sales_module.md
(ENTITIES_DIR / "inventory_and_sales_module.md").write_text("""# Entity: Stock Movement & POS Sales

- **Criticality:** CRITICAL
- **Files:** `src/services/InventoryService.ts`, `src/services/SaleService.ts`, `src/services/PurchaseService.ts`
- **Description:** Handles stock deductions, manual inventory adjustments, purchase receipt increments, and POS sale transactions.
- **Trust Boundary:** Incoming POS sale payload must validate item quantities against active stock before committing.
- **Security Constraints:**
  - `SaleService.create` enforces `current_stock >= item.quantity` and throws exception on insufficient stock.
  - Stock movements register immutable log records in `inventory_movements`.
- **Associated Vulnerabilities:** [CWE-840 Business Logic Flaws](../vulnerabilities/CWE-840_Business_Logic.md), [CWE-362 Race Conditions](../vulnerabilities/CWE-362_Race_Condition.md)
""", encoding="utf-8")

# Entity 4: financial_and_cash_module.md
(ENTITIES_DIR / "financial_and_cash_module.md").write_text("""# Entity: Cash Register & Financial Ledger

- **Criticality:** CRITICAL
- **Files:** `src/services/CashService.ts`, `src/services/FinancialService.ts`
- **Description:** Controls cash register open/close state, cash movements (sangria/suprimento), accounts payable, and accounts receivable.
- **Trust Boundary:** Money movements require open cash register session and role authorization.
- **Security Constraints:**
  - Automatic cash movements generated on cash sales.
  - Audit log entries recorded for manual cash adjustments.
- **Associated Vulnerabilities:** [CWE-862 Missing Authorization](../vulnerabilities/CWE-862_Missing_Authorization.md)
""", encoding="utf-8")

# 4. Write Vulnerability Class Documents under vulnerabilities/

(VULN_DIR / "CWE-285_Improper_Authorization.md").write_text("""# CWE-285: Improper Authorization

- **Description:** Occurs when an application does not perform or incorrectly performs authorization checks when an authenticated actor attempts to access a resource or execute an action.
- **Impact in Adega Cloud:** Unauthorized users accessing financial data, cash registers, or modifying system configurations.
- **Mitigation Pattern:** Validate permissions via `usePermission` in UI and enforce RLS policies in Supabase tables.
""", encoding="utf-8")

(VULN_DIR / "CWE-862_Missing_Authorization.md").write_text("""# CWE-862: Missing Authorization

- **Description:** The software does not perform an authorization check when an actor attempts to access a resource or perform an action.
- **Impact in Adega Cloud:** Bypassing permission checks on sensitive API routes or RPC procedures.
- **Mitigation Pattern:** Verify user role and permission tokens in all API endpoints and database functions.
""", encoding="utf-8")

(VULN_DIR / "CWE-840_Business_Logic.md").write_text("""# CWE-840: Business Logic Vulnerabilities

- **Description:** Flaws in application workflow, state transitions, or validation logic that allow actors to misuse intended application functions.
- **Impact in Adega Cloud:** Negative stock balances, zero or negative sale amounts, unauthorized discounts, or selling out-of-stock items.
- **Mitigation Pattern:** Enforce strict validation rules (e.g. stock level checks, price calculations based on catalog) prior to database transaction commitment.
""", encoding="utf-8")

(VULN_DIR / "CWE-287_Improper_Authentication.md").write_text("""# CWE-287: Improper Authentication

- **Description:** Occurs when an actor's identity is improperly verified or authenticated token validation is missing/weak.
- **Impact in Adega Cloud:** Unauthorized session access or session hijack.
- **Mitigation Pattern:** Use standard Supabase JWT validation and secure HttpOnly cookie handling.
""", encoding="utf-8")

# 5. Write index.md
index_content = """# Adega Cloud — Security Knowledge Base Index

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
"""

(KB_DIR / "index.md").write_text(index_content, encoding="utf-8")

# 6. Per-pass KB Archive & State Update
import shutil
for item in KB_DIR.iterdir():
    if item.is_file():
        shutil.copy2(item, ARCHIVE_KB_DIR / item.name)
    elif item.is_dir():
        shutil.copytree(item, ARCHIVE_KB_DIR / item.name, dirs_exist_ok=True)

# Create empty learnings.jsonl if not exists, then archive it
learnings_file = WORKSPACE / "learnings.jsonl"
if not learnings_file.exists():
    learnings_file.write_text("", encoding="utf-8")

archived_learnings_path = ARCHIVE_LEARNINGS_DIR / "learnings_pass_1_1.jsonl"
shutil.move(str(learnings_file), str(archived_learnings_path))

# Update workspace/.mantis_state.json
state_path = WORKSPACE / ".mantis_state.json"
state_data = {
    "current_stage": "mantis-architecture",
    "completed_stages": [
        "mantis-summarize",
        "mantis-architecture"
    ],
    "active_snapshot": {
        "root": "d:/Claudcoude/projetos/adega",
        "snapshot_id": "live-tree",
        "snapshot_pinned": False
    },
    "pass_number": 1,
    "total_findings": 0,
    "last_updated": "2026-08-03T10:46:30-03:00"
}
state_path.write_text(json.dumps(state_data, indent=2), encoding="utf-8")

print("Mantis Architecture Knowledge Base synthesis complete.")
