#!/usr/bin/env python3
import json
import os
import sys
import time
from datetime import datetime, timezone
from edit_targets import first_edit_target, iter_edit_targets
from mcp_research import mcp_research_done


def _apex_state_file() -> str:
    codex_home = os.environ.get(
        "CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")
    )
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return os.path.join(
        codex_home, "fusengine", "logs", "00-apex", f"{today}-state.json"
    )


def _load_apex_authorization(framework: str) -> dict:
    state_file = _apex_state_file()
    if not os.path.isfile(state_file):
        return {}
    try:
        with open(state_file, encoding="utf-8") as f:
            state = json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}
    auth = state.get("authorizations", {})
    entry = auth.get(framework, {})
    return entry if isinstance(entry, dict) else {}


def _session_authorized(entry: dict, session_id: str, ttl: int = 180) -> bool:
    sessions = entry.get("doc_sessions") or entry.get("sessions") or []
    if session_id not in sessions:
        return False
    try:
        ts = datetime.strptime(
            entry.get("doc_consulted", ""), "%Y-%m-%dT%H:%M:%SZ"
        )
    except ValueError:
        return False
    return ttl >= time.time() - ts.replace(tzinfo=timezone.utc).timestamp()


def find_project_root(start_dir: str, *markers: str) -> str:
    """Find project root by walking up and checking for marker files."""
    d = os.path.abspath(start_dir)
    while d != "/":
        for marker in markers:
            if os.path.exists(os.path.join(d, marker)):
                return d
        d = os.path.dirname(d)
    return os.getcwd()


def _rollout_doc(session_id: str) -> bool:
    """code_mode fallback: doc research (Context7+Exa) seen in the rollout tree."""
    try:
        from rollout_evidence import doc_consulted
        return doc_consulted(session_id)
    except Exception:
        return False


def skill_was_consulted(framework: str, session_id: str,
                        project_root: str) -> bool:
    """Base skill consulted via APEX state, or doc research in the rollout
    (PostToolUse does not fire in code_mode — openai/codex#19385)."""
    entry = _load_apex_authorization(framework)
    return _session_authorized(entry, session_id) or _rollout_doc(session_id)


def specific_skill_consulted(framework: str, skill_name: str,
                             session_id: str) -> bool:
    """Specific skill read via APEX state, or via the rollout tree (code_mode)."""
    entry = _load_apex_authorization(framework)
    if _session_authorized(entry, session_id) and any(
            f"skills/{skill_name}/" in str(source)
            for source in entry.get("sources", [])):
        return True
    try:
        from rollout_evidence import skill_read
        return skill_read(session_id, skill_name)
    except Exception:
        return False


def deny_block(reason: str) -> None:
    """Output hookSpecificOutput deny block (PreToolUse) and exit."""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)
