#!/usr/bin/env python3
"""Extract file paths read through Codex shell tool payloads."""
import os
import re
import shlex

READ_TOOLS = {"Read"}
SHELL_TOOLS = {"Bash", "Shell", "exec_command"}
READ_COMMANDS = {"bat", "cat", "grep", "head", "less", "nl", "rg", "sed", "tail"}
DOC_RE = re.compile(r"(^|/)skills/.+\.(md|txt)$")


def _clean_token(token: str) -> str:
    return token.strip().strip("'\"")


def _candidate_paths(command: str) -> list[str]:
    try:
        tokens = shlex.split(command, posix=True)
    except ValueError:
        return []
    if not tokens or os.path.basename(tokens[0]) not in READ_COMMANDS:
        return []
    return [_clean_token(token) for token in tokens[1:] if DOC_RE.search(_clean_token(token))]


def _resolve(path: str, cwd: str = "") -> str:
    if not path or os.path.isabs(path):
        return path
    return os.path.abspath(os.path.join(cwd or os.getcwd(), path))


def skill_doc_path_from_payload(data: dict) -> str:
    """Return a skill doc path from Read or shell read-like hook payloads."""
    tool_input = data.get("tool_input") or {}
    if data.get("tool_name") in READ_TOOLS:
        return tool_input.get("file_path", "")
    if data.get("tool_name") not in SHELL_TOOLS:
        return ""
    command = str(tool_input.get("command") or "")
    cwd = str(data.get("cwd") or tool_input.get("cwd") or "")
    for path in _candidate_paths(command):
        return _resolve(path, cwd)
    return ""
