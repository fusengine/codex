#!/usr/bin/env python3
"""PostToolUse hook - Track Tailwind skill file reads via shared tracking."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
try:
    from shell_read_paths import skill_doc_path_from_payload
    from tracking import track_skill_read
except ImportError:
    sys.exit(0)


def main():
    """Track Read tool calls on skill files."""
    data = json.load(sys.stdin)
    file_path = skill_doc_path_from_payload(data)
    if not re.search(r"skills/.*\.(md|txt)$", file_path):
        sys.exit(0)

    session_id = data.get("session_id") or f"fallback-{os.getpid()}"
    track_skill_read("tailwind", "skill:Read", file_path, session_id)


if __name__ == "__main__":
    main()
