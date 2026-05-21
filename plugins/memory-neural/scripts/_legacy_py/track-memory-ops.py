#!/usr/bin/env python3
"""track-memory-ops.py - PostToolUse hook (graphiti/qdrant).

Logs memory operations for analytics.
"""

import json
import os
import sys
from datetime import datetime, timezone


def main() -> None:
    """Main entry for memory operations tracking."""
    log_dir = os.path.join(os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")), "logs", "00-memory")
    os.makedirs(log_dir, exist_ok=True)

    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    tool = data.get("tool_name", "unknown")
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    status = "ok"
    if data.get("tool_result", {}).get("error"):
        status = "error"

    log_file = os.path.join(log_dir, "operations.log")
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{ts}] {tool} | {status}\n")
    except OSError:
        sys.exit(0)

    # Rotate log if > 1000 lines
    try:
        with open(log_file, encoding="utf-8") as f:
            lines = f.readlines()
        if len(lines) > 1000:
            with open(log_file, "w", encoding="utf-8") as f:
                f.writelines(lines[-500:])
    except OSError:
        pass


if __name__ == "__main__":
    main()
