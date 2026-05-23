#!/usr/bin/env python3
"""track-skill-read.py - Track skill file reads for design-expert."""

import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from shell_read_paths import skill_doc_path_from_payload
from tracking import track_skill_read
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pipeline_checks import load_state, save_state

FRAMEWORK = "design"
_CACHE_DIR = os.path.join(os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")), "fusengine")
FLAG_FILE = os.path.join(_CACHE_DIR, "design-agent-active")


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = skill_doc_path_from_payload(data)
    if not re.search(r"skills/.*\.(md|txt)$", file_path):
        sys.exit(0)

    session_id = data.get("session_id") or f"fallback-{os.getpid()}"
    track_skill_read(FRAMEWORK, "skill:Read", file_path, session_id)

    # Update state if a design agent is active
    if not os.path.isfile(FLAG_FILE):
        sys.exit(0)
    try:
        with open(FLAG_FILE, encoding="utf-8") as f:
            agent_id = f.read().strip()
    except OSError:
        sys.exit(0)
    if not agent_id:
        sys.exit(0)
    state = load_state(agent_id)
    if not state:
        sys.exit(0)
    if "identity-system" in file_path or "0-identity-system" in file_path:
        state["templates_read"] = True
    if "design-inspiration" in file_path:
        state["inspiration_read"] = True
    save_state(state)
    sys.exit(0)


if __name__ == "__main__":
    main()
