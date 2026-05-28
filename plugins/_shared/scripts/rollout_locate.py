#!/usr/bin/env python3
"""Locate/parse the Codex session rollout tree (main + child subagent rollouts).

PostToolUse is unreliable in code_mode (openai/codex#19385) and research runs in
subagents (own rollouts, linked via session_id), so scan the whole tree.
"""
import glob
import json
import os
import time
from datetime import datetime

CODEX_HOME = os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex"))
MAX_TAIL_BYTES = 512 * 1024
MAX_AGE_SECONDS = 3600
HEAD_BYTES = 4096


def _recent_rollouts() -> list:
    """Return rollout paths modified within MAX_AGE_SECONDS (bounded scan)."""
    pattern = os.path.join(CODEX_HOME, "sessions", "**", "*.jsonl")
    now = time.time()
    out = []
    for path in glob.glob(pattern, recursive=True):
        try:
            if now - os.path.getmtime(path) <= MAX_AGE_SECONDS:
                out.append(path)
        except OSError:
            continue
    return out


def _head(path: str) -> str:
    """Return the first HEAD_BYTES of a file (session_meta lives on line 1)."""
    try:
        with open(path, "rb") as fh:
            return fh.read(HEAD_BYTES).decode("utf-8", "replace")
    except OSError:
        return ""


def session_rollouts(session_id: str) -> list:
    """Main rollout (filename UUID) plus children referencing session_id."""
    if not session_id:
        return []
    out = []
    for path in _recent_rollouts():
        if session_id in os.path.basename(path) or session_id in _head(path):
            out.append(path)
    return out


def tail_lines(path: str) -> list:
    """Return the last MAX_TAIL_BYTES of the file as lines (recent events)."""
    try:
        size = os.path.getsize(path)
        with open(path, "rb") as fh:
            if size > MAX_TAIL_BYTES:
                fh.seek(size - MAX_TAIL_BYTES)
            data = fh.read()
    except OSError:
        return []
    return data.decode("utf-8", "replace").splitlines()


def _within_ttl(entry: dict, cutoff: float) -> bool:
    """True if entry has no timestamp or its timestamp is newer than cutoff."""
    ts = entry.get("timestamp", "")
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp() >= cutoff
    except (ValueError, AttributeError):
        return True


def _payload(entry: dict) -> dict:
    """Normalise a rollout entry to its function_call payload across formats."""
    payload = entry.get("payload")
    if isinstance(payload, dict):
        return payload
    item = entry.get("item")
    return item if isinstance(item, dict) else entry


def iter_function_calls(session_id: str, ttl_seconds: int):
    """Yield function_call payloads within the TTL across the session tree."""
    cutoff = time.time() - ttl_seconds
    for path in session_rollouts(session_id):
        for line in tail_lines(path):
            if "function_call" not in line:
                continue
            try:
                entry = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue
            if not _within_ttl(entry, cutoff):
                continue
            payload = _payload(entry)
            if payload.get("type") == "function_call":
                yield payload
