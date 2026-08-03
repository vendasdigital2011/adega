# CWE-840: Business Logic Vulnerabilities

- **Description:** Flaws in application workflow, state transitions, or validation logic that allow actors to misuse intended application functions.
- **Impact in Adega Cloud:** Negative stock balances, zero or negative sale amounts, unauthorized discounts, or selling out-of-stock items.
- **Mitigation Pattern:** Enforce strict validation rules (e.g. stock level checks, price calculations based on catalog) prior to database transaction commitment.
