#!/usr/bin/env python3
"""PreToolUse: short-circuit MCP calls when a cached answer exists."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared.state_manager import sanitize_session_id

def _query_keys(tool_name: str):
    """Map any Claude/Codex MCP tool id to its query fields via substring match.
    Codex exposes exa tools under variable names (web_search_exa, _web_search_exa,
    mcp__exa__web_search_exa) and context7 as query_docs/query-docs."""
    if "get_code_context_exa" in tool_name:
        return ("query", "libraryName")
    if "web_search_exa" in tool_name:
        return ("query",)
    if "context7" in tool_name and "query" in tool_name:
        return ("query", "topic", "libraryName")
    return None
CODEX_HOME = os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex"))
BASE_DIR = os.path.join(CODEX_HOME, "fusengine", "sessions")
MAX_BODY = 8 * 1024
RG_TIMEOUT = 2
TTL_SECONDS = 48 * 3600


def _extract_query(tool_input: dict, keys: tuple) -> str:
    for key in keys:
        val = tool_input.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def _rg_find(query: str, cache_dir: str) -> str:
    needle = query.replace("\n", " ").replace("\r", " ")[:80]
    try:
        proc = subprocess.run(
            ["rg", "-l", "-i", "-F", "--max-count=1", needle, cache_dir],
            timeout=RG_TIMEOUT, capture_output=True, text=True, check=False)
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return ""
    if proc.returncode != 0 or not proc.stdout:
        return ""
    return proc.stdout.splitlines()[0].strip()


def _read_body(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read(MAX_BODY)
    except OSError:
        return ""


def _deny(reason: str) -> None:
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
        "permissionDecision": "deny", "permissionDecisionReason": reason}}))
    sys.exit(0)


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    tool_name = data.get("tool_name", "")
    keys = _query_keys(tool_name)
    if keys is None:
        sys.exit(0)
    query = _extract_query(data.get("tool_input") or {}, keys)
    try:
        sid = sanitize_session_id(data.get("session_id", "") or "unknown")
    except ValueError:
        sys.exit(0)
    cache_dir = os.path.join(BASE_DIR, sid, "context", "mcp")
    if not query or not os.path.isdir(cache_dir):
        sys.exit(0)
    match = _rg_find(query, cache_dir)
    if not match:
        sys.exit(0)
    try:
        age = time.time() - os.path.getmtime(match)
    except OSError:
        sys.exit(0)
    if age >= TTL_SECONDS:
        sys.exit(0)
    body = _read_body(match)
    if body:
        _deny(f"CACHE HIT (~{len(body) // 1024 + 1}KB saved, cached {int(age // 3600)}h ago): {body}")


if __name__ == "__main__":
    main()
