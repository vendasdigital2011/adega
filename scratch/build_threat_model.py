import json
import shutil
from pathlib import Path

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
KB_DIR = WORKSPACE / "kb"
ARCHIVE_KB_DIR = WORKSPACE / "archive" / "kb"
ARCHIVE_KB_DIR.mkdir(parents=True, exist_ok=True)

state_path = WORKSPACE / ".mantis_state.json"
pass_num = 1
if state_path.exists():
    state_data = json.loads(state_path.read_text(encoding="utf-8"))
    pass_num = state_data.get("pass_number", 1)

tm_path = KB_DIR / "THREAT_MODEL.md"
if tm_path.exists():
    shutil.copy2(tm_path, ARCHIVE_KB_DIR / f"THREAT_MODEL_pass_{pass_num}.md")

tm_content = """<!-- KB_SNAPSHOT: live-tree -->
# Adega Cloud — System Threat Model

## System Overview Summary
Adega Cloud is a commercial multi-tenant ERP/POS system for beverage retail management built on Next.js 15 App Router, React, Tailwind CSS, and Supabase (PostgreSQL + Auth + RLS).

## Deployment Intent
`Intent: PRODUCTION`

### Production-Signal Verification Checklist:
1. NO entity classified as CRITICAL/STANDARD? **FALSE** (Auth, Permission RBAC, Stock Ledger, and Cash Register entities are all classified CRITICAL).
2. Architecture names NO externally-reachable service/API/deployment descriptor? **FALSE** (Next.js web app deployed to production at Vercel `https://adega-delta.vercel.app`, uses Supabase DB API endpoints).
3. KB describes NO installable/publishable runtime package? **FALSE** (Production package `adega-cloud` with Next.js web build).
4. Code lies exclusively in test/demo directories? **FALSE** (Core production code resides in `src/app/`, `src/services/`, `src/features/`).
5. NO real untrusted input crossing trust boundaries? **FALSE** (Web requests, login forms, sales creation payloads, inventory adjustments, and cash register sangria/suprimento entries).

*Conclusion:* Deployment Intent MUST be `PRODUCTION`.

## Trust Boundaries
1. **Unauthenticated Public Internet $\rightarrow$ Next.js App Router / Middleware**
   - *Entry points:* `/login`, `/forgot-password`, `/reset-password`, public assets.
   - *Assets at risk:* Auth credentials, JWT tokens, system routes.
   - *Relevant Entities:* `[Authentication Module](entities/auth_module.md)`

2. **Authenticated Web Client $\rightarrow$ API / Service Layer (`src/services/`)**
   - *Entry points:* Sales creation, inventory movements, purchase orders, financial payables/receivables, cash register operations.
   - *Assets at risk:* Financial transactions, stock ledger accuracy, company data isolation (`company_id`).
   - *Relevant Entities:* `[Stock & Sales Module](entities/inventory_and_sales_module.md)`, `[Cash & Financial Module](entities/financial_and_cash_module.md)`

3. **Service Layer / User Input $\rightarrow$ Role-Based Authorization Engine (`PermissionService`)**
   - *Entry points:* User management, role permission updates, company settings.
   - *Assets at risk:* Privilege escalation, unauthorized feature access.
   - *Relevant Entities:* `[RBAC Module](entities/rbac_permissions_module.md)`

4. **Service Layer $\rightarrow$ Supabase PostgreSQL Database (RLS Policies & Stored Procedures)**
   - *Entry points:* Database queries (`select`, `insert`, `update`, `delete`, `rpc`).
   - *Assets at risk:* Multi-tenant database integrity, table data confidentiality.

## Threat Actors & Attack Vectors
1. **Unauthenticated External Attacker**
   - *Goal:* Bypass authentication, brute-force credentials, access protected admin routes, leverage unauthenticated API routes.
   - *Reachable Surface:* `/login`, `/forgot-password`, `/reset-password`, public HTTP endpoints, client bundles.

2. **Authenticated Low-Privilege Attacker (e.g. Vendedor / Regular Employee)**
   - *Goal:* Privilege escalation to Admin, viewing financial ledger/reports without permission, altering stock balances, closing cash registers out of process.
   - *Reachable Surface:* POS Sale creation, inventory list views, customer management, cash register interface.

3. **Malicious Tenant / Multi-Tenancy Cross-Tenant Attacker**
   - *Goal:* Access or tamper with data belonging to another `company_id` in Supabase database tables or LocalStorage fallback stores.
   - *Reachable Surface:* API parameters, Supabase RLS policies, LocalStorage mock store manipulation.

## High-Risk Assets & Availability Tiers
- **Authentication Credentials & User Passwords**: `CRITICAL`
- **Multi-Tenant Database Ledger (Sales, Stock, Cash, Financial)**: `CRITICAL` (24/7 operational impact if corrupted or tampered)
- **Role & Permission Matrix (`role_permissions`)**: `CRITICAL`
- **Reports & Analytical Dashboard**: `STANDARD` (Short downtime tolerable)
- **Audit Logs (`audit_logs`)**: `STANDARD`
"""

tm_path.write_text(tm_content, encoding="utf-8")
print("Threat Model synthesis complete.")

# Update state
state_data["current_stage"] = "mantis-threat-model"
state_data["completed_stages"].append("mantis-threat-model")
state_data["last_updated"] = "2026-08-03T10:59:30-03:00"
state_path.write_text(json.dumps(state_data, indent=2), encoding="utf-8")
