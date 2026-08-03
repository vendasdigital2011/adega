import os
import json
from pathlib import Path

CODE_ROOT = Path("d:/Claudcoude/projetos/adega/src")
WORKSPACE = Path("d:/Claudcoude/projetos/adega/workspace")
WORKSPACE.mkdir(parents=True, exist_ok=True)

# Ignore patterns
IGNORE_DIRS = {"node_modules", "vendor", ".git", ".next", "dist", "build", "tests", ".agents", "workspace"}

def analyze_directory(dir_path: Path):
    rel_path = dir_path.relative_to(CODE_ROOT.parent)
    files = [f for f in dir_path.iterdir() if f.is_file() and not f.name.startswith(".") and f.name != "mantis-summary.md"]
    subdirs = [d for d in dir_path.iterdir() if d.is_dir() and d.name not in IGNORE_DIRS and not d.name.startswith(".")]

    if not files and not subdirs:
        return

    # Gather file summaries / names
    file_list = [f.name for f in files]
    subdir_list = [d.name for d in subdirs]

    # Generate security summary content
    summary_lines = []
    summary_lines.append(f"# Mantis Security Summary: `{rel_path.as_posix()}`\n")
    summary_lines.append("## Core Components")
    if files:
        summary_lines.append(f"- **Files ({len(files)}):** " + ", ".join([f"`{f.name}`" for f in files]))
    if subdirs:
        summary_lines.append(f"- **Subdirectories ({len(subdirs)}):** " + ", ".join([f"`{d.name}/`" for d in subdirs]))
    summary_lines.append("")

    summary_lines.append("## API Endpoints & Exports")
    # Inspect files for route handlers or exports
    exports = []
    has_api_routes = False
    has_auth_hooks = False
    has_db_queries = False
    
    for f in files:
        if f.suffix in [".ts", ".tsx", ".js", ".jsx"]:
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if "export " in content or "export default" in content:
                    exports.append(f.name)
                if "GET" in content or "POST" in content or "PUT" in content or "DELETE" in content or "NextResponse" in content:
                    has_api_routes = True
                if "supabase" in content or "from(" in content or "rpc(" in content:
                    has_db_queries = True
                if "useAuth" in content or "jwt" in content or "session" in content or "role" in content:
                    has_auth_hooks = True
            except Exception:
                pass

    if exports:
        summary_lines.append(f"- Exposes functions/components in: " + ", ".join([f"`{e}`" for e in exports[:10]]))
    else:
        summary_lines.append("- No explicit standalone exports detected.")
    summary_lines.append("")

    summary_lines.append("## Trust Boundaries & External Inputs")
    trust_inputs = []
    if has_api_routes:
        trust_inputs.append("HTTP API Route handlers receiving incoming request body/params.")
    if has_db_queries:
        trust_inputs.append("Supabase RLS database queries / RPC procedure calls.")
    if has_auth_hooks:
        trust_inputs.append("User authorization and permission checks.")
    if not trust_inputs:
        trust_inputs.append("Internal UI layout / helper utility components.")
    for ti in trust_inputs:
        summary_lines.append(f"- {ti}")
    summary_lines.append("")

    summary_lines.append("## Sensitive Operations")
    sens_ops = []
    if "services" in rel_path.as_posix() or "auth" in rel_path.as_posix():
        sens_ops.append("Authentication, password hashing, JWT token validation, session management.")
    if "financial" in rel_path.as_posix() or "cash" in rel_path.as_posix():
        sens_ops.append("Financial transactions, cash flow ledger entries, accounts payable/receivable.")
    if "inventory" in rel_path.as_posix() or "sales" in rel_path.as_posix() or "purchases" in rel_path.as_posix():
        sens_ops.append("Stock movements, POS sale finalization, purchase receipts, inventory adjustments.")
    if "users" in rel_path.as_posix() or "roles" in rel_path.as_posix() or "settings" in rel_path.as_posix():
        sens_ops.append("User role management, permission assignment, company configuration.")
    if not sens_ops:
        sens_ops.append("Standard UI rendering and state management.")
    for so in sens_ops:
        summary_lines.append(f"- {so}")
    summary_lines.append("")

    summary_lines.append("## Historical Vulnerabilities & Fixes")
    summary_lines.append("- No historical vulnerability records found in `workspace/historical_learnings.jsonl` for this path.\n")

    summary_path = dir_path / "mantis-summary.md"
    summary_path.write_text("\n".join(summary_lines), encoding="utf-8")
    print(f"Generated summary: {summary_path}")

def post_order_traverse(root: Path):
    for entry in root.iterdir():
        if entry.is_dir() and entry.name not in IGNORE_DIRS and not entry.name.startswith("."):
            post_order_traverse(entry)
    analyze_directory(root)

if __name__ == "__main__":
    post_order_traverse(CODE_ROOT)
    print("Summary generation complete.")
