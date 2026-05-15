#!/usr/bin/env python3
"""auto-capture-error.py - PostToolUse hook (Bash).

Captures Bash errors to Graphiti neural memory.
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError


NEURAL_HOST = os.environ.get("NEURAL_MEMORY_HOST", "localhost")
GRAPHITI_PORT = os.environ.get("GRAPHITI_PORT", "8000")
SALIENCE_THRESHOLD = 0.30


def _severity(stderr: str) -> int:
    """Compute severity (1-10) based on error patterns."""
    s = stderr.lower()
    if any(k in s for k in ("fatal", "panic")):
        return 10
    if any(k in s for k in ("error", "failed")):
        return 8
    if "warning" in s:
        return 4
    if "deprecated" in s:
        return 2
    return 5


def main() -> None:
    """Main entry for Bash error capture."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    exit_code = str(data.get("tool_result", {}).get("exit_code", "0"))
    stderr = data.get("tool_result", {}).get("stderr", "")

    if exit_code == "0" or not stderr:
        sys.exit(0)

    sev = _severity(stderr)
    salience = 0.40 * sev / 10 + 0.30 * 1.0 + 0.20 * 0.5 + 0.10 * 0.5
    if salience <= SALIENCE_THRESHOLD:
        sys.exit(0)

    error_msg = stderr[:500]
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    episode = json.dumps({
        "name": "bash_error",
        "episode_body": f"Bash error (exit {exit_code}): {error_msg}",
        "source_description": "auto-capture",
        "reference_time": ts,
    }).encode("utf-8")

    try:
        req = Request(
            f"http://{NEURAL_HOST}:{GRAPHITI_PORT}/episodes",
            data=episode,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urlopen(req, timeout=5)
    except (URLError, OSError):
        pass

    print(f'<memory-capture salience="{salience:.2f}" severity="{sev}">')
    print("Error captured in neural memory (Graphiti).")
    print(f'Search for similar past errors: use '
          f'mcp__qdrant__qdrant-find with query "{error_msg}"')
    print("If you solve this, store the solution: "
          "use mcp__qdrant__qdrant-store")
    print("</memory-capture>")


if __name__ == "__main__":
    main()
