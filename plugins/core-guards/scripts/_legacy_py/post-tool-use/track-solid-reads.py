#!/usr/bin/env python3
"""PostToolUse hook: Track SOLID principle reads in session state."""
import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared.state_manager import load_session_state, save_session_state

FRAMEWORK_MAP = {
    'solid-nextjs': 'nextjs', 'solid-react': 'react',
    'solid-php': 'php', 'solid-swift': 'swift',
    'solid-generic': 'generic', 'solid-java': 'java',
    'solid-go': 'go', 'solid-ruby': 'ruby', 'solid-rust': 'rust',
}


def file_paths_from_payload(data):
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    if tool_name == "Read" and file_path:
        return [file_path]
    command = tool_input.get("command", "") or tool_input.get("input", "")
    if not command:
        return []
    if not re.search(r"\b(cat|sed|nl|less|head|tail|bat|rg|grep)\b", command):
        return []
    return re.findall(
        r"(?:~|/|\.)?[^\s\x22\x27]*solid-[^\s\x22\x27]+/(?:references/[^\s\x22\x27]+|SKILL\.md)",
        command,
    )


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    session_id = data.get("session_id", "") or "unknown"
    paths = file_paths_from_payload(data)
    if not paths:
        sys.exit(0)

    state = load_session_state(session_id)
    solid_reads = state.setdefault("solid_reads", [])

    for file_path in paths:
        if not re.search(r"solid-[^/]+/(references/|SKILL\.md)", file_path):
            continue
        framework = ""
        for key, val in FRAMEWORK_MAP.items():
            if key in file_path:
                framework = val
                break
        if not framework:
            continue
        solid_reads.append({
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "framework": framework,
            "session": session_id,
            "file": file_path,
        })

    save_session_state(session_id, state)
    sys.exit(0)



if __name__ == "__main__":
    main()
