# MANTIS_HELPER_VERSION = 2
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

def append_calibrate(finding_path, impact_score, likelihood_score, availability_tier, inferred_exposure, attacker_position, mantis_risk_score, priority, sanity_triage_applied, calibration_checklist, outrage_commentary, executive_summary, pass_num, snapshot_id):
    p = Path(finding_path)
    if not p.exists():
        print(f"Error: {finding_path} does not exist.")
        return

    data = json.loads(p.read_text(encoding="utf-8"))

    now_iso = datetime.now(timezone.utc).isoformat()

    data["impact_score"] = impact_score
    data["likelihood_score"] = likelihood_score
    data["availability_tier"] = availability_tier
    data["inferred_exposure"] = inferred_exposure
    data["attacker_position"] = attacker_position
    data["mantis_risk_score"] = mantis_risk_score
    data["priority"] = priority
    data["sanity_triage_applied"] = sanity_triage_applied
    data["calibration_checklist"] = calibration_checklist
    data["outrage_commentary"] = outrage_commentary
    data["executive_summary"] = executive_summary

    calibrate_entry = {
        "stage": "calibrate",
        "action": "calibrated",
        "details": f"Calculated risk score as {mantis_risk_score} and priority as {priority}.",
        "pass_number": pass_num,
        "snapshot": snapshot_id,
        "timestamp": now_iso
    }

    data.setdefault("history", []).append(calibrate_entry)
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Successfully calibrated {p.name} -> Score {mantis_risk_score} ({priority})")
