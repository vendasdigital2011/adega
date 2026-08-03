import os
import json
from pathlib import Path

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
PLAN_PATH = WORKSPACE / "plan.json"
STATE_PATH = WORKSPACE / ".mantis_state.json"

# Update state with changed_files computation
changed_files = [
  "src/services/InventoryService.ts",
  "src/services/PurchaseService.ts",
  "src/services/CustomerService.ts",
  "src/features/customers/hooks/useCustomers.ts",
  "src/features/sales/components/SaleForm.tsx",
  "src/services/SaleService.ts",
  "src/features/sales/hooks/useSales.ts",
  "src/services/PermissionService.ts",
  "src/features/settings/components/PermissionsManager.tsx",
  "src/app/(admin)/settings/page.tsx"
]

if STATE_PATH.exists():
    state_data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    state_data["changed_files"] = changed_files
    state_data["changed_files_status"] = "COMPUTED"
    state_data["changed_files_pass"] = 1
    state_data["current_stage"] = "mantis-plan"
    state_data["completed_stages"].append("mantis-plan")
    state_data["last_updated"] = "2026-08-03T11:02:10-03:00"
    STATE_PATH.write_text(json.dumps(state_data, indent=2), encoding="utf-8")

plan_content = {
  "investigations": [
    {
      "title": "Exhaustive Review: src/services/AuthService.ts & middleware.ts",
      "target_files": [
        "src/services/AuthService.ts",
        "src/middleware.ts",
        "src/features/auth/components/LoginForm.tsx"
      ],
      "kb_references": [
        "workspace/kb/entities/auth_module.md",
        "workspace/kb/vulnerabilities/CWE-287_Improper_Authentication.md",
        "workspace/kb/THREAT_MODEL.md"
      ],
      "question": "Trace JWT session validation, route guarding, and authentication fallback in demo mode. Verify that unauthenticated requests to protected endpoints or admin pages cannot bypass middleware verification or spoof user identities."
    },
    {
      "title": "Exhaustive Review: src/services/PermissionService.ts & PermissionMatrix",
      "target_files": [
        "src/services/PermissionService.ts",
        "src/services/RoleService.ts",
        "src/features/settings/components/PermissionsManager.tsx",
        "src/hooks/usePermission.ts"
      ],
      "kb_references": [
        "workspace/kb/entities/rbac_permissions_module.md",
        "workspace/kb/vulnerabilities/CWE-285_Improper_Authorization.md",
        "workspace/kb/vulnerabilities/CWE-862_Missing_Authorization.md"
      ],
      "question": "Audit the 14-module x 8-action permission matrix implementation. Verify if any API route, service call, or Supabase RPC fails to check user permissions or allows unauthorized role escalation."
    },
    {
      "title": "Exhaustive Review: src/services/InventoryService.ts & SaleService.ts",
      "target_files": [
        "src/services/InventoryService.ts",
        "src/services/SaleService.ts",
        "src/services/PurchaseService.ts"
      ],
      "kb_references": [
        "workspace/kb/entities/inventory_and_sales_module.md",
        "workspace/kb/vulnerabilities/CWE-840_Business_Logic.md"
      ],
      "question": "Verify stock ledger calculations across all 10 movement types. Audit SaleService.create to ensure out-of-stock purchases are strictly blocked without side effects, and verify subtotal calculations correspond to catalog prices."
    },
    {
      "title": "Exhaustive Review: src/services/CashService.ts & FinancialService.ts",
      "target_files": [
        "src/services/CashService.ts",
        "src/services/FinancialService.ts"
      ],
      "kb_references": [
        "workspace/kb/entities/financial_and_cash_module.md",
        "workspace/kb/vulnerabilities/CWE-862_Missing_Authorization.md"
      ],
      "question": "Examine cash register session enforcement, manual sangria/suprimento adjustments, and accounts payable/receivable ledgers to ensure proper authorization and audit logging."
    },
    {
      "title": "Adversarial Sweep: src/features/ai/components/AIChat.tsx & AIService",
      "target_files": [
        "src/services/AIService.ts",
        "src/features/ai/components/AIChat.tsx",
        "src/app/ai/page.tsx"
      ],
      "kb_references": [],
      "question": "Perform an unconstrained security review of AI chat prompts, input sanitization, context window injection, and external API error handling in the AI assistant module."
    }
  ]
}

PLAN_PATH.write_text(json.dumps(plan_content, indent=2), encoding="utf-8")
print("Mantis Plan roadmap created successfully.")
