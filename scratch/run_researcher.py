import os
import json
import uuid
import hashlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
FINDINGS_DIR = WORKSPACE / "findings"
FINDINGS_DIR.mkdir(parents=True, exist_ok=True)

STATE_PATH = WORKSPACE / ".mantis_state.json"
pass_num = 1
snapshot_id = "live-tree"

if STATE_PATH.exists():
    state_data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    pass_num = state_data.get("pass_number", 1)
    active = state_data.get("active_snapshot", {})
    snapshot_id = active.get("snapshot_id", "live-tree")

now_iso = datetime.now(timezone.utc).isoformat()

def compute_signature(title, cwe, primary_target):
    normalized_title = "".join(c for c in title if c.isalnum()).lower()
    cwe_part = cwe if cwe else ""
    raw_str = f"{normalized_title}|{cwe_part}|{primary_target}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()[:16]

findings_data = [
    {
        "title": "Unrestricted Local Mock Store Permission Fallback in Demo Mode",
        "description": "In `PermissionService.listForRole`, when offline or demo mode is active, all permissions are granted by default (`initialGranted = allPerms.map(p => p.id)`). An unauthenticated or low-privileged user accessing local mock stores automatically inherits full administrative privileges across all 14 system modules without server-side validation.",
        "impact": "Privilege Escalation to Full System Admin in demo/offline mode.",
        "severity": "HIGH",
        "privileges_required": "LOW",
        "attacker_position": "LOCAL",
        "user_interaction": "NONE",
        "code_paths": ["src/services/PermissionService.ts:88"],
        "cwe": "CWE-285",
        "mitigation": "Ensure role-based permission lists in offline/demo fallback strictly reflect defined role scopes rather than granting global access."
    },
    {
        "title": "Missing Transactional Locking on Concurrent POS Sale Stock Deduction",
        "description": "In `SaleService.create`, stock availability is checked (`p.current_stock >= item.quantity`) and decremented client-side in LocalStorage/IndexedDB mock stores without concurrency locks or atomic state guards. Concurrent sale submissions for low-stock items could result in race conditions.",
        "impact": "Business Logic Flaw resulting in negative stock balances during simultaneous POS checkout operations.",
        "severity": "MEDIUM",
        "privileges_required": "LOW",
        "attacker_position": "INTERNAL_NETWORK",
        "user_interaction": "NONE",
        "code_paths": ["src/services/SaleService.ts:188", "src/services/SaleService.ts:206"],
        "cwe": "CWE-840",
        "mitigation": "Wrap stock deduction in Supabase RPC database-level row locks (e.g. SELECT FOR UPDATE) or atomic decrements."
    }
]

created_ids = []

for f in findings_data:
    f_id = str(uuid.uuid4())
    primary = f["code_paths"][0].split(":")[0] if f["code_paths"] else ""
    sig = compute_signature(f["title"], f.get("cwe"), primary)
    
    finding_obj = {
        "id": f_id,
        "title": f["title"],
        "description": f["description"],
        "impact": f["impact"],
        "severity": f["severity"],
        "privileges_required": f["privileges_required"],
        "attacker_position": f["attacker_position"],
        "user_interaction": f["user_interaction"],
        "status": "PROVISIONALLY_VALID",
        "code_paths": f["code_paths"],
        "discovery_commit": snapshot_id,
        "cwe": f.get("cwe"),
        "signature": sig,
        "lineage_id": str(uuid.uuid4()),
        "mitigation": f["mitigation"],
        "history": [
            {
                "stage": "researcher",
                "action": "created",
                "details": "Initial audit finding recorded.",
                "pass_number": pass_num,
                "timestamp": now_iso
            }
        ]
    }
    
    out_file = FINDINGS_DIR / f"{f_id}.json"
    out_file.write_text(json.dumps(finding_obj, indent=2), encoding="utf-8")
    created_ids.append(f_id)

# Update state
state_data["current_stage"] = "mantis-researcher"
state_data["completed_stages"].append("mantis-researcher")
state_data["total_findings"] = len(created_ids)
state_data["last_updated"] = now_iso
STATE_PATH.write_text(json.dumps(state_data, indent=2), encoding="utf-8")

print(f"Mantis Researcher complete. Created {len(created_ids)} raw findings: {created_ids}")
