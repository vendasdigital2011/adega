# CWE-287: Improper Authentication

- **Description:** Occurs when an actor's identity is improperly verified or authenticated token validation is missing/weak.
- **Impact in Adega Cloud:** Unauthorized session access or session hijack.
- **Mitigation Pattern:** Use standard Supabase JWT validation and secure HttpOnly cookie handling.
