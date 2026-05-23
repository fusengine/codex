#!/usr/bin/env python3
"""track-skill-read.py - Track skill file reads for laravel-expert."""

import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from shell_read_paths import skill_doc_path_from_payload
from tracking import track_skill_read

FRAMEWORK = "laravel"


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
    sys.exit(0)


if __name__ == "__main__":
    main()
