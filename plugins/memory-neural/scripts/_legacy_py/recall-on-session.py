#!/usr/bin/env python3
"""recall-on-session.py - SessionStart hook.

Detects project type and recalls relevant lessons from Graphiti.
"""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError


NEURAL_HOST = os.environ.get("NEURAL_MEMORY_HOST", "localhost")
GRAPHITI_PORT = os.environ.get("GRAPHITI_PORT", "8000")


def _detect_project_type() -> str:
    """Detect project type from current directory markers."""
    checks = [
        ("package.json", "node"), ("composer.json", "php"),
        ("Package.swift", "swift"), ("Cargo.toml", "rust"),
        ("go.mod", "go"),
    ]
    for f, t in checks:
        if os.path.isfile(f):
            return t
    if os.path.isfile("requirements.txt") or os.path.isfile("pyproject.toml"):
        return "python"
    return "unknown"


def main() -> None:
    """Main entry for session start recall."""
    log_dir = os.path.join(os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")), "logs", "00-memory")
    os.makedirs(log_dir, exist_ok=True)

    project_type = _detect_project_type()
    project_name = os.path.basename(os.getcwd())

    search_body = json.dumps({
        "query": f"{project_type} {project_name} common errors",
        "num_results": 5,
    }).encode("utf-8")

    search_result = ""
    try:
        req = Request(
            f"http://{NEURAL_HOST}:{GRAPHITI_PORT}/search",
            data=search_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=5) as resp:
            search_result = resp.read().decode("utf-8")
    except (URLError, OSError):
        pass

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    log_file = os.path.join(log_dir, "recalls.log")
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"[{ts}] session_recall | {project_type} "
                    f"| {project_name}\n")
    except OSError:
        pass

    if search_result:
        try:
            results = json.loads(search_result).get("results", [])
            if results:
                lessons = "\n".join(
                    f"- {r.get('content') or r.get('name', 'unknown')}"
                    for r in results[:5]
                )
                print(f'<neural-memory-recall project="{project_name}" '
                      f'type="{project_type}">')
                print("Relevant lessons from past sessions:")
                print(lessons)
                print("For deeper search: use mcp__qdrant__qdrant-find "
                      "with project-specific queries.")
                print("</neural-memory-recall>")
        except (json.JSONDecodeError, KeyError):
            pass


if __name__ == "__main__":
    main()
