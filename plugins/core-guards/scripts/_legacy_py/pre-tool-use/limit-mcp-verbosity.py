#!/usr/bin/env python3
"""PreToolUse: cap verbose MCP tool inputs."""
from __future__ import annotations

import json
import sys

EXA_SEARCH = "mcp__exa__web_search_exa"
EXA_CODE = "mcp__exa__get_code_context_exa"
CONTEXT7 = "mcp__context7__query-docs"
MAX_NUM_RESULTS = 3
MAX_TOKENS = 2000


def _cap_int(value: object, ceiling: int) -> int | None:
    try:
        n = int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    if n <= 0:
        return None
    return min(n, ceiling)


def cap_exa_search(tool_input: dict) -> dict | None:
    current = tool_input.get("numResults")
    capped = _cap_int(current, MAX_NUM_RESULTS)
    if capped is None:
        capped = MAX_NUM_RESULTS
    if current == capped:
        return None
    updated = dict(tool_input)
    updated["numResults"] = capped
    return updated


def cap_fields(tool_input: dict, caps: tuple[tuple[str, int], ...]) -> dict | None:
    updated = dict(tool_input)
    changed = False
    for field, ceiling in caps:
        if field not in updated:
            continue
        capped = _cap_int(updated[field], ceiling)
        if capped is not None and updated[field] != capped:
            updated[field] = capped
            changed = True
    return updated if changed else None


def compute_update(tool_name: str, tool_input: dict) -> dict | None:
    if tool_name == EXA_SEARCH:
        return cap_exa_search(tool_input)
    if tool_name == EXA_CODE:
        return cap_fields(tool_input, (("numResults", MAX_NUM_RESULTS), ("tokensNum", MAX_TOKENS)))
    if tool_name == CONTEXT7:
        return cap_fields(tool_input, (("tokens", MAX_TOKENS),))
    return None


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    tool_input = data.get("tool_input") or {}
    if not isinstance(tool_input, dict):
        sys.exit(0)
    updated = compute_update(data.get("tool_name", ""), tool_input)
    if updated is None:
        sys.exit(0)
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "allow",
        "updatedInput": updated,
    }}))


if __name__ == "__main__":
    main()
