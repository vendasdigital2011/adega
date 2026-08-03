import os
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

# MANTIS_HELPER_VERSION = 2

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
FINDINGS_DIR = WORKSPACE / "findings"
TRASH_DIR = FINDINGS_DIR / ".trash"
TRASH_DIR.mkdir(parents=True, exist_ok=True)
TX_LOG = WORKSPACE / ".tx_log.jsonl"
HELPERS_DIR = WORKSPACE / "helpers"
HELPERS_DIR.mkdir(parents=True, exist_ok=True)

STATE_PATH = WORKSPACE / ".mantis_state.json"
pass_num = 1
snapshot_id = "live-tree"
snapshot_pinned = False

if STATE_PATH.exists():
    state_data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    pass_num = state_data.get("pass_number", 1)
    active = state_data.get("active_snapshot", {})
    snapshot_id = active.get("snapshot_id", "live-tree")
    snapshot_pinned = active.get("snapshot_pinned", False)

now_iso = datetime.now(timezone.utc).isoformat()

# Load current findings from workspace/findings/ (excluding .trash)
current_findings = []
for p in FINDINGS_DIR.glob("*.json"):
    if p.is_file() and not p.name.startswith("."):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            current_findings.append((p, data))
        except Exception:
            pass

print(f"Loaded {len(current_findings)} findings for deduplication check.")

# 1. Stamp discovery_commit if missing
for path, item in current_findings:
    if "discovery_commit" not in item:
        item["discovery_commit"] = snapshot_id
        path.write_text(json.dumps(item, indent=2), encoding="utf-8")

# 2. Check for intra-batch duplicates (matching code_paths with line numbers & similar titles)
merged_map = {} # primary_id -> list of merged_ids
trashed_ids = set()

# Process batch dedup
i = 0
while i < len(current_findings):
    path_i, data_i = current_findings[i]
    if data_i["id"] in trashed_ids:
        i += 1
        continue
    
    j = i + 1
    while j < len(current_findings):
        path_j, data_j = current_findings[j]
        if data_j["id"] in trashed_ids:
            j += 1
            continue

        # Check exact code_path match
        paths_i = set(data_i.get("code_paths", []))
        paths_j = set(data_j.get("code_paths", []))
        
        if paths_i and paths_j and paths_i == paths_j:
            # Merge j into i
            primary_id = data_i["id"]
            duplicate_id = data_j["id"]
            
            # Update duplicate item status
            data_j["status"] = "DUPLICATE"
            data_j["duplicate_of"] = primary_id
            trash_target = TRASH_DIR / f"{duplicate_id}.json"
            trash_target.write_text(json.dumps(data_j, indent=2), encoding="utf-8")
            path_j.unlink() # remove from findings/
            trashed_ids.add(duplicate_id)
            
            # Log transaction
            tx_record = {
                "timestamp": now_iso,
                "action": "dedupe_merge",
                "primary_uuid": primary_id,
                "moved_uuid": duplicate_id
            }
            with open(TX_LOG, "a", encoding="utf-8") as tx_file:
                tx_file.write(json.dumps(tx_record) + "\n")
                
            print(f"Merged duplicate finding {duplicate_id} into primary {primary_id}")
        j += 1
    i += 1

# Save remaining active count
remaining = [p for p in FINDINGS_DIR.glob("*.json") if p.is_file() and not p.name.startswith(".")]

state_data["current_stage"] = "mantis-dedupe"
state_data["completed_stages"].append("mantis-dedupe")
state_data["total_findings"] = len(remaining)
state_data["last_updated"] = now_iso
STATE_PATH.write_text(json.dumps(state_data, indent=2), encoding="utf-8")

print(f"Mantis Dedupe complete. Active findings: {len(remaining)}, Trashed duplicates: {len(trashed_ids)}")
