#!/usr/bin/env python3
"""Shared MCP research evidence checks."""
import os
import time
from datetime import datetime, timezone
import json


def _state_file():
    codex_home = os.environ.get(
        "CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")
    )
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return os.path.join(
        codex_home, "fusengine", "logs", "00-apex", f"{today}-state.json"
    )


def _entry_recent(entry, session_id, now, ttl):
    if session_id not in entry.get("doc_sessions", []):
        return False
    try:
        ts = datetime.strptime(
            entry.get("doc_consulted", ""), "%Y-%m-%dT%H:%M:%SZ"
        )
    except ValueError:
        return False
    return ttl >= now - ts.replace(tzinfo=timezone.utc).timestamp()


def _apex_mcp_research_done(session_id, ttl=180):
    """Check APEX 00-apex state for recent Context7 + Exa consultation."""
    state_file = _state_file()
    if not os.path.isfile(state_file):
        return False
    try:
        with open(state_file, encoding="utf-8") as f:
            state = json.load(f)
    except (json.JSONDecodeError, OSError):
        return False
    now = time.time()
    found_sources = set()
    for entry in state.get("authorizations", {}).values():
        if not _entry_recent(entry, session_id, now, ttl):
            continue
        found_sources.update(str(src).split(":", 1)[0] for src in entry.get("sources", []))
        if {"context7", "exa"}.issubset(found_sources):
            return True
    return False


def mcp_research_done(session_id):
    """Check if recent MCP research from Context7 and Exa was done.

    Falls back to the session rollout when the APEX state is empty, because
    per-tool PostToolUse hooks do not fire in code_mode (openai/codex#19385).
    """
    if _apex_mcp_research_done(session_id):
        return True
    try:
        from rollout_evidence import doc_consulted
        return doc_consulted(session_id)
    except Exception:
        return False
