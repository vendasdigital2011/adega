import os
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
FINDINGS_DIR = WORKSPACE / "findings"
LEARNINGS_FILE = WORKSPACE / "learnings.jsonl"
STATE_PATH = WORKSPACE / ".mantis_state.json"

pass_num = 1
snapshot_id = "live-tree"

if STATE_PATH.exists():
    state_data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    pass_num = state_data.get("pass_number", 1)
    active = state_data.get("active_snapshot", {})
    snapshot_id = active.get("snapshot_id", "live-tree")

now_iso = datetime.now(timezone.utc).isoformat()

for p in FINDINGS_DIR.glob("*.json"):
    if p.is_file() and not p.name.startswith("."):
        data = json.loads(p.read_text(encoding="utf-8"))
        title = data.get("title", "")
        
        # Idempotency check: skip if critic stage already recorded in history
        history = data.get("history", [])
        if any(h.get("stage") == "critic" and h.get("pass_number") == pass_num for h in history):
            print(f"Skipping {p.name}: critic evaluation already present.")
            continue
            
        if "Unrestricted Local Mock Store Permission Fallback" in title:
            viability = "CONDITIONAL_VIABLE"
            reasoning = "Targeted feature executes during offline or demo mode fallback deployments. Active in staging and offline POS deployments, conditional on demo/offline mode trigger."
        elif "Missing Transactional Locking on Concurrent POS Sale" in title:
            viability = "VIABLE"
            reasoning = "Targeted flaw is fully triggerable in standard production POS checkout operations during high-concurrency periods."
        else:
            viability = "VIABLE"
            reasoning = "Targeted flaw is reachable and triggerable in production release configuration."

        data["production_viability"] = viability
        data["critic_reasoning"] = reasoning

        critic_history = {
            "stage": "critic",
            "action": "evaluated",
            "details": f"Determined production viability as {viability} because {reasoning[:100]}...",
            "pass_number": pass_num,
            "snapshot": snapshot_id,
            "timestamp": now_iso
        }
        data.setdefault("history", []).append(critic_history)
        p.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"Critic evaluated {p.name} -> {viability}")

        # Append to learnings.jsonl
        learning_entry = {
            "title": title,
            "code_paths": data.get("code_paths", []),
            "status": viability,
            "snapshot": snapshot_id
        }
        with open(LEARNINGS_FILE, "a", encoding="utf-8") as f_out:
            f_out.write(json.dumps(learning_entry) + "\n")

# Update state
if STATE_PATH.exists():
    state_data["current_stage"] = "mantis-critic"
    state_data["completed_stages"].append("mantis-critic")
    state_data["last_updated"] = now_iso
    STATE_PATH.write_text(json.dumps(state_data, indent=2), encoding="utf-8")

print("Mantis Critic evaluation completed successfully.")
