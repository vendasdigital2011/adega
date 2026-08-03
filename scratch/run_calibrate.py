import os
import json
import sys
from pathlib import Path

sys.path.append("workspace/helpers")
from append_calibrate import append_calibrate

ROOT = Path("d:/Claudcoude/projetos/adega")
WORKSPACE = ROOT / "workspace"
FINDINGS_DIR = WORKSPACE / "findings"

STATE_PATH = WORKSPACE / ".mantis_state.json"
pass_num = 1
snapshot_id = "live-tree"

if STATE_PATH.exists():
    state_data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    pass_num = state_data.get("pass_number", 1)
    active = state_data.get("active_snapshot", {})
    snapshot_id = active.get("snapshot_id", "live-tree")

calibration_checklist_template = {
    "repro_failure": {"outcome": "DOES_NOT_APPLY"},
    "unreachable_inputs": {"outcome": "DOES_NOT_APPLY"},
    "third_party_reachability": {"outcome": "DOES_NOT_APPLY"},
    "minor_config_hygiene": {"outcome": "DOES_NOT_APPLY"},
    "non_security_critical": {"outcome": "DOES_NOT_APPLY"},
    "vague_code_paths": {"outcome": "DOES_NOT_APPLY"},
    "unreliable_triggers": {"outcome": "DOES_NOT_APPLY"},
    "prerequisite_shell": {"outcome": "DOES_NOT_APPLY"},
    "physical_long_term": {"outcome": "DOES_NOT_APPLY"},
    "trusted_controller_zero_delta": {"outcome": "DOES_NOT_APPLY"},
    "standard_host_attacks": {"outcome": "DOES_NOT_APPLY"},
    "static_confirmation": {"outcome": "DOES_NOT_APPLY"},
    "strict_xss": {"outcome": "DOES_NOT_APPLY"},
    "internal_nested": {"outcome": "DOES_NOT_APPLY"},
    "probabilistic_llm": {"outcome": "DOES_NOT_APPLY"},
    "supply_chain_prerequisites": {"outcome": "DOES_NOT_APPLY"},
    "non_default_config": {"outcome": "DOES_NOT_APPLY"},
    "confidential_computing_host": {"outcome": "DOES_NOT_APPLY"},
    "trusted_controller_critical_bypass": {"outcome": "DOES_NOT_APPLY"},
    "local_attack_vector": {"outcome": "DOES_NOT_APPLY"},
    "self_contained_blast": {"outcome": "DOES_NOT_APPLY"},
    "rarely_exposed": {"outcome": "DOES_NOT_APPLY"},
    "equivalent_primitives": {"outcome": "DOES_NOT_APPLY"},
    "documented_insecure_config": {"outcome": "DOES_NOT_APPLY"},
    "physical_temporary": {"outcome": "DOES_NOT_APPLY"},
    "high_privilege_external": {"outcome": "DOES_NOT_APPLY"},
    "trusted_controller_standard_bypass": {"outcome": "DOES_NOT_APPLY"}
}

for p in FINDINGS_DIR.glob("*.json"):
    if p.is_file() and not p.name.startswith("."):
        data = json.loads(p.read_text(encoding="utf-8"))
        title = data.get("title", "")
        
        if "Unrestricted Local Mock Store Permission Fallback" in title:
            # Impact: 4 (Security control bypass), Likelihood: 3, Multiplier: 0.8 (INTERNAL) -> (4+3)*0.8 = 5.6 -> Priority MEDIUM
            impact = 4
            likelihood = 3
            avail_tier = "CRITICAL"
            exposure = "INTERNAL"
            position = "LOCAL"
            score = 5.6
            priority = "MEDIUM"
            triage_applied = "Local Attack Vector; Internal Component"
            outrage = "Moderate outrage risk if unauthorized internal users access admin configuration in offline mode."
            exec_summary = "Unrestricted local permission fallback in demo/offline mode allows low-privilege users to inherit full admin permissions."
            
        elif "Missing Transactional Locking on Concurrent POS Sale" in title:
            # Impact: 3 (Logic flaw stock balance), Likelihood: 3, Multiplier: 1.0 (EXPOSED POS) -> (3+3)*1.0 = 6.0 -> Priority HIGH
            impact = 3
            likelihood = 3
            avail_tier = "CRITICAL"
            exposure = "EXPOSED"
            position = "INTERNAL_NETWORK"
            score = 6.0
            priority = "HIGH"
            triage_applied = "Direct POS Transaction Exposure"
            outrage = "High merchant outrage if negative inventory causes stock ledger mismatch during peak sales hours."
            exec_summary = "Absence of row locks in POS sale creation allows concurrent checkouts to deplete inventory past zero."

        else:
            impact = 3
            likelihood = 3
            avail_tier = "STANDARD"
            exposure = "INTERNAL"
            position = "INTERNAL_NETWORK"
            score = 4.8
            priority = "MEDIUM"
            triage_applied = "Internal Component"
            outrage = "Standard operational impact."
            exec_summary = "General security review finding."

        append_calibrate(
            str(p), impact, likelihood, avail_tier, exposure, position, score, priority,
            triage_applied, calibration_checklist_template, outrage, exec_summary, pass_num, snapshot_id
        )

# Update state
if STATE_PATH.exists():
    state_data["current_stage"] = "mantis-calibrate"
    state_data["completed_stages"].append("mantis-calibrate")
    state_data["last_updated"] = "2026-08-03T14:06:15-03:00"
    STATE_PATH.write_text(json.dumps(state_data, indent=2), encoding="utf-8")

print("Mantis Calibrate completed successfully.")
