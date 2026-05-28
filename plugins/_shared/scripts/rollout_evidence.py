#!/usr/bin/env python3
"""Read APEX evidence (doc consultation, SOLID reads) from the Codex rollout.

The rollout JSONL is ground truth because per-tool PostToolUse hooks are not
reliably emitted in code_mode (openai/codex#19385). Doc/SOLID evidence always
precedes the apply_patch, so it is already flushed when a gate reads it.
"""
import json
import os
import re
import shlex
from rollout_locate import iter_function_calls

READ_COMMANDS = {"bat", "cat", "grep", "head", "less", "nl", "rg", "sed", "tail"}
CONTEXT7_RE = re.compile(r"query[_-]docs|resolve[_-]library[_-]id|context7", re.I)
EXA_RE = re.compile(r"exa", re.I)


def _ident(payload: dict) -> str:
    """Concatenate name, namespace and string arguments for provider matching."""
    args = payload.get("arguments")
    return "{} {} {}".format(
        payload.get("name", ""),
        payload.get("namespace", ""),
        args if isinstance(args, str) else "",
    )


def doc_consulted(session_id: str, ttl_seconds: int = 180) -> bool:
    """True if BOTH Context7 and Exa appear in the rollout within the TTL.

    Matches bare names (query_docs), separate namespace (mcp__context7__) and
    code_mode calls embedded in exec_command arguments (tools.mcp__exa__...).
    """
    context7 = exa = False
    for payload in iter_function_calls(session_id, ttl_seconds):
        ident = _ident(payload)
        if CONTEXT7_RE.search(ident):
            context7 = True
        if EXA_RE.search(ident):
            exa = True
        if context7 and exa:
            return True
    return False


def _paths_from_command(command: str) -> list:
    """Extract read targets from a shell command (cat/sed/head/... FILE)."""
    try:
        tokens = shlex.split(command, posix=True)
    except ValueError:
        return []
    if not tokens or os.path.basename(tokens[0]) not in READ_COMMANDS:
        return []
    return [t for t in tokens[1:] if t and not t.startswith("-")]


def read_paths_in_transcript(session_id: str, ttl_seconds: int = 120) -> list:
    """Return file paths read via shell (exec_command) within the TTL window."""
    found = []
    for payload in iter_function_calls(session_id, ttl_seconds):
        args = payload.get("arguments")
        if isinstance(args, str):
            try:
                args = json.loads(args)
            except (json.JSONDecodeError, ValueError):
                args = {}
        if isinstance(args, dict):
            found.extend(_paths_from_command(str(args.get("cmd") or args.get("command") or "")))
    return found


def solid_ref_read(session_id: str, skill_dir: str, ttl_seconds: int = 120) -> bool:
    """True if any SOLID reference under skill_dir was read in the rollout."""
    if not skill_dir:
        return False
    needle = os.path.basename(skill_dir.rstrip("/")) or skill_dir
    for path in read_paths_in_transcript(session_id, ttl_seconds):
        if skill_dir in path or (needle in path and path.endswith((".md", ".txt"))):
            return True
    return False


def skill_read(session_id: str, skill_name: str, ttl_seconds: int = 180) -> bool:
    """True if a file under skills/<skill_name>/ was read in the rollout tree.

    Version-agnostic: matches the read regardless of the cache version segment
    (…/<plugin>/<version>/skills/<skill_name>/…).
    """
    if not skill_name:
        return False
    needle = "skills/{}/".format(skill_name)
    return any(needle in path for path in read_paths_in_transcript(session_id, ttl_seconds))
