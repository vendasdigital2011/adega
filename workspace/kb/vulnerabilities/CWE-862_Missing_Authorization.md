# CWE-862: Missing Authorization

- **Description:** The software does not perform an authorization check when an actor attempts to access a resource or perform an action.
- **Impact in Adega Cloud:** Bypassing permission checks on sensitive API routes or RPC procedures.
- **Mitigation Pattern:** Verify user role and permission tokens in all API endpoints and database functions.
