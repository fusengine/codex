#!/usr/bin/env python3
"""PostToolUse hook - Tracks security skill reads for compliance validation."""
import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
try:
    from shell_read_paths import skill_doc_path_from_payload
except ImportError:
    sys.exit(0)


def main():
    """Track Read tool calls on security skill files."""
    data = json.load(sys.stdin)

    file_path = skill_doc_path_from_payload(data)
    pattern = r"skills/(security-scan|cve-research|dependency-audit|security-headers|auth-audit)/"
    if not re.search(pattern, file_path):
        sys.exit(0)

    state_dir = os.path.join(os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")), "logs", "00-security")
    os.makedirs(state_dir, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    state_file = os.path.join(state_dir, f"{today}-state.json")
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    state = {"skill_read": False, "reads": []}
    if os.path.isfile(state_file):
        try:
            with open(state_file, encoding="utf-8") as f:
                state = json.load(f)
        except (json.JSONDecodeError, OSError):
            pass

    state["skill_read"] = True
    state.setdefault("reads", []).append({"timestamp": timestamp, "file": file_path})

    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
    sys.exit(0)


if __name__ == "__main__":
    main()
