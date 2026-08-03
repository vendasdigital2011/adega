# Adega Cloud — System Security Architecture

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
