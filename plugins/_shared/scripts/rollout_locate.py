#!/usr/bin/env python3
"""Locate/parse the Codex session rollout tree (main + child subagent rollouts).

PostToolUse is unreliable in code_mode (openai/codex#19385) and research runs in
subagents (own rollouts, linked via session_id), so scan the whole tree.
"""
import glob
import json
import os
import time

CODEX_HOME = os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex"))
MAX_TAIL_BYTES = 8 * 1024 * 1024  # memory backstop; real scoping is turn-anchoring below
MAX_AGE_SECONDS = 3600
HEAD_BYTES = 4096
# Current-turn anchors: last user_message, else task_started (subagent child
# rollouts have none). Match compact (Codex/Rust) and spaced (Python) JSON.
TURN_MARKERS = (('"type": "user_message"', '"type":"user_message"'),
                ('"type": "task_started"', '"type":"task_started"'))


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


def _anchor_index(lines: list) -> int:
    """Index of the current turn's start (last user_message, else task_started)."""
    for markers in TURN_MARKERS:
        for i in range(len(lines) - 1, -1, -1):
            if any(m in lines[i] for m in markers):
                return i
    return 0


def tail_lines(path: str) -> list:
    """Current turn's lines: MAX_TAIL_BYTES tail sliced from the anchor."""
    try:
        size = os.path.getsize(path)
        with open(path, "rb") as fh:
            if size > MAX_TAIL_BYTES:
                fh.seek(size - MAX_TAIL_BYTES)
            data = fh.read()
    except OSError:
        return []
    lines = data.decode("utf-8", "replace").splitlines()
    return lines[_anchor_index(lines):]


def _payload(entry: dict) -> dict:
    """Normalise a rollout entry to its function_call payload across formats."""
    payload = entry.get("payload")
    if isinstance(payload, dict):
        return payload
    item = entry.get("item")
    return item if isinstance(item, dict) else entry


def iter_function_calls(session_id: str, ttl_seconds: int = 0):  # noqa: ARG001
    """Yield CURRENT-TURN function_call payloads (tail_lines is turn-scoped; ttl ignored)."""
    for path in session_rollouts(session_id):
        for line in tail_lines(path):
            if "function_call" not in line:
                continue
            try:
                entry = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue
            payload = _payload(entry)
            if payload.get("type") == "function_call":
                yield payload
