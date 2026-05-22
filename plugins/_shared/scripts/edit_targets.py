#!/usr/bin/env python3
"""Edit target extraction for Claude/Codex hook payloads."""

import os
import re
from typing import Optional


def iter_edit_targets(data: dict) -> list[dict]:
    """Return Write/Edit/apply_patch targets from hook input."""
    tool = data.get("tool_name")
    tool_input = data.get("tool_input") or {}
    if tool == "apply_patch":
        command = str(tool_input.get("command")
                      or tool_input.get("input")
                      or tool_input.get("patch") or "")
        return _parse_apply_patch(command)
    if tool not in ("Write", "Edit"):
        return []
    file_path = str(tool_input.get("file_path") or "")
    if not file_path:
        return []
    content = str(tool_input.get("content") or tool_input.get("new_string") or "")
    return [{"file_path": file_path, "content": content, "action": tool}]


def first_edit_target(data: dict, file_pattern: str,
                      skip_pattern: str = "") -> Optional[dict]:
    """Return first edited target matching file and skip filters."""
    for target in iter_edit_targets(data):
        file_path = target.get("file_path", "")
        if not re.search(file_pattern, file_path):
            continue
        if skip_pattern and re.search(skip_pattern, file_path):
            continue
        return target
    return None


def _parse_apply_patch(command: str) -> list[dict]:
    """Parse Codex apply_patch V4A command into edited file targets."""
    targets = []
    file_path = ""
    action = ""
    added = []

    def flush() -> None:
        if file_path and action != "Delete":
            targets.append({
                "file_path": file_path,
                "content": "\n".join(added),
                "action": action,
            })

    for line in command.splitlines():
        match = re.match(r"^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$", line)
        if match:
            flush()
            action = match.group(1)
            file_path = match.group(2).strip()
            added = []
            continue
        if action in ("Add", "Update") and line.startswith("+") and not line.startswith("+++"):
            added.append(line[1:])
    flush()
    return targets


def read_existing_content(file_path: str) -> str:
    """Read a file if it exists, returning an empty string on failure."""
    if not os.path.isfile(file_path):
        return ""
    try:
        with open(file_path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return ""


def target_content(target: dict, prefer_existing: bool = False) -> str:
    """Return useful content for validation from an edit target."""
    file_path = str(target.get("file_path") or "")
    content = str(target.get("content") or "")
    if prefer_existing:
        return read_existing_content(file_path) or content
    return content
