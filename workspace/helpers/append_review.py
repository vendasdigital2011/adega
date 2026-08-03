# MANTIS_HELPER_VERSION = 2
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

def append_review(finding_path, status, reasoning, triage_checklist, repro_hints, pass_num, snapshot_id):
    p = Path(finding_path)
    if not p.exists():
        print(f"Error: {finding_path} does not exist.")
        return

    data = json.loads(p.read_text(encoding="utf-8"))

    # Idempotency check: skip if (pass_number, snapshot) already present in reviewer history
    history = data.get("history", [])
    for entry in history:
        if entry.get("stage") == "reviewer" and entry.get("pass_number") == pass_num and entry.get("snapshot") == snapshot_id:
            print(f"Skipping {finding_path}: already reviewed for pass {pass_num} and snapshot {snapshot_id}")
            return

    now_iso = datetime.now(timezone.utc).isoformat()

    data["status"] = status
    data["reasoning"] = reasoning
    if repro_hints:
        data["repro_hints"] = repro_hints
    elif "repro_hints" in data and status in ["FALSE_POSITIVE", "NEEDS_RESEARCH"]:
        pass

    data["triage_checklist"] = triage_checklist

    reviewer_entry = {
        "stage": "reviewer",
        "action": "reviewed",
        "details": f"Determined status as {status} because {reasoning[:100]}...",
        "pass_number": pass_num,
        "snapshot": snapshot_id,
        "timestamp": now_iso
    }

    data.setdefault("history", []).append(reviewer_entry)
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Successfully reviewed {p.name} -> {status}")

if __name__ == "__main__":
    if len(sys.argv) < 7:
        print("Usage: python append_review.py <finding_path> <status> <reasoning_file> <checklist_file> <pass_num> <snapshot_id> [repro_hints_file]")
        sys.exit(1)

    f_path = sys.argv[1]
    status = sys.argv[2]
    reasoning_path = sys.argv[3]
    checklist_path = sys.argv[4]
    pass_num = int(sys.argv[5])
    snapshot_id = sys.argv[6]
    repro_hints_path = sys.argv[7] if len(sys.argv) > 7 else None

    reasoning = Path(reasoning_path).read_text(encoding="utf-8").strip()
    triage_checklist = json.loads(Path(checklist_path).read_text(encoding="utf-8"))
    repro_hints = Path(repro_hints_path).read_text(encoding="utf-8").strip() if repro_hints_path and Path(repro_hints_path).exists() else None

    append_review(f_path, status, reasoning, triage_checklist, repro_hints, pass_num, snapshot_id)
