<!-- KB_SNAPSHOT: live-tree -->
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
1. **Unauthenticated Public Internet $ightarrow$ Next.js App Router / Middleware**
   - *Entry points:* `/login`, `/forgot-password`, `/reset-password`, public assets.
   - *Assets at risk:* Auth credentials, JWT tokens, system routes.
   - *Relevant Entities:* `[Authentication Module](entities/auth_module.md)`

2. **Authenticated Web Client $ightarrow$ API / Service Layer (`src/services/`)**
   - *Entry points:* Sales creation, inventory movements, purchase orders, financial payables/receivables, cash register operations.
   - *Assets at risk:* Financial transactions, stock ledger accuracy, company data isolation (`company_id`).
   - *Relevant Entities:* `[Stock & Sales Module](entities/inventory_and_sales_module.md)`, `[Cash & Financial Module](entities/financial_and_cash_module.md)`

3. **Service Layer / User Input $ightarrow$ Role-Based Authorization Engine (`PermissionService`)**
   - *Entry points:* User management, role permission updates, company settings.
   - *Assets at risk:* Privilege escalation, unauthorized feature access.
   - *Relevant Entities:* `[RBAC Module](entities/rbac_permissions_module.md)`

4. **Service Layer $ightarrow$ Supabase PostgreSQL Database (RLS Policies & Stored Procedures)**
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
