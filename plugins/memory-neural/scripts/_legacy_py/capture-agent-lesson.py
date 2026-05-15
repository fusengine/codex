#!/usr/bin/env python3
"""capture-agent-lesson.py - SubagentStop hook.

Extracts conclusions from finished agents, stores in Graphiti.
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError


NEURAL_HOST = os.environ.get("NEURAL_MEMORY_HOST", "localhost")
GRAPHITI_PORT = os.environ.get("GRAPHITI_PORT", "8000")


def _agent_severity(name: str) -> int:
    """Compute severity based on agent type."""
    if name in ("sniper", "sniper-faster"):
        return 8
    if name == "research-expert":
        return 6
    if name.endswith("-expert"):
        return 7
    return 5


def main() -> None:
    """Main entry for agent lesson capture."""
    log_dir = os.path.join(os.path.expanduser("~"),
                           ".claude", "logs", "00-memory")
    os.makedirs(log_dir, exist_ok=True)

    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    agent_name = data.get("agent_name", "unknown")
    last_msg = data.get("last_assistant_message", "")
    exit_reason = data.get("exit_reason", "unknown")

    if not last_msg or exit_reason == "error":
        sys.exit(0)
    if agent_name in ("explore-codebase", "websearch"):
        sys.exit(0)

    lesson = last_msg[:1000]
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    log_file = os.path.join(log_dir, "agent-lessons.log")
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{ts}] {agent_name} | {exit_reason} "
                    f"| {lesson[:80]}...\n")
    except OSError:
        pass

    sev = _agent_severity(agent_name)
    salience = 0.40 * sev / 10 + 0.30 * 1.0 + 0.20 * 0.5 + 0.10 * 0.5
    if salience <= 0.30:
        sys.exit(0)

    episode = json.dumps({
        "name": "agent_lesson",
        "episode_body": f"Agent {agent_name} conclusion: {lesson}",
        "source_description": f"agent-stop-{agent_name}",
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


if __name__ == "__main__":
    main()
