# Entity: Authentication & Access Control

- **Criticality:** CRITICAL
- **Files:** `src/features/auth/`, `src/services/AuthService.ts`, `src/middleware.ts`
- **Description:** Manages user authentication, session tokens, password resets, and route protection middleware.
- **Trust Boundary:** Validates credentials against Supabase Auth. Protected routes require active session cookies/JWT.
- **Security Constraints:**
  - Password inputs validated via Zod schemas.
  - Route guards in `middleware.ts` redirect unauthenticated traffic away from `/(admin)`.
- **Associated Vulnerabilities:** [CWE-287 Authentication Bypass](../vulnerabilities/CWE-287_Improper_Authentication.md)
