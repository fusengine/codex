#!/usr/bin/env python3
"""tracking.py - Centralized tracking functions for skill/MCP usage.

Importable functions (no main).
"""

import json
import os
from datetime import datetime, timezone

CODEX_HOME = os.environ.get(
    "CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")
)
APEX_DIR = os.path.join(CODEX_HOME, "fusengine", "logs", "00-apex")


def _utc_now() -> str:
    """Return current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _state_file() -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return os.path.join(APEX_DIR, f"{today}-state.json")


def _load_state(path: str) -> dict:
    if not os.path.isfile(path):
        return {"$schema": "apex-state-v1", "target": {}, "authorizations": {}}
    try:
        with open(path, encoding="utf-8") as f:
            state = json.load(f)
        return state if isinstance(state, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {"$schema": "apex-state-v1", "target": {}, "authorizations": {}}


def _record_source(framework: str, session_id: str, source: str) -> None:
    os.makedirs(APEX_DIR, exist_ok=True)
    path = _state_file()
    state = _load_state(path)
    auth = state.setdefault("authorizations", {})
    entry = auth.setdefault(framework, {})
    entry["doc_consulted"] = _utc_now()
    sources = entry.get("sources", [])
    if source not in sources:
        sources.append(source)
    entry["sources"] = sources
    entry["source"] = source
    for key in ("doc_sessions", "sessions"):
        sessions = entry.get(key, [])
        if session_id and session_id not in sessions:
            sessions.append(session_id)
        entry[key] = sessions
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def track_skill_read(framework: str, skill: str, topic: str,
                     session_id: str = "") -> None:
    """Track a skill read event."""
    if not session_id:
        session_id = str(os.getpid())
    _record_source(framework, session_id, f"{skill}:{topic}")
    if framework != "generic":
        _record_source("generic", session_id, f"{skill}:{topic}")


def track_mcp_research(source: str, tool: str, query: str,
                       session_id: str = "") -> None:
    """Track an MCP research call."""
    if not session_id:
        session_id = str(os.getpid())
    q = query.lower()
    framework = "generic"
    for kw, fw in [("react", "react"), ("next", "nextjs"),
                   ("tailwind", "tailwind"), ("swift", "swift"),
                   ("swiftui", "swift"), ("ios", "swift"),
                   ("design", "design"), ("shadcn", "design"),
                   ("laravel", "laravel"), ("php", "laravel")]:
        if kw in q:
            framework = fw
    _record_source(framework, session_id, f"{source}:{tool}")
    if framework != "generic":
        _record_source("generic", session_id, f"{source}:{tool}")
