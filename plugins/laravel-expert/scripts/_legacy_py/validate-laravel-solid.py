#!/usr/bin/env python3
"""validate-laravel-solid.py - PostToolUse hook: SOLID validation for Laravel/PHP."""

import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from edit_targets import iter_edit_targets
from hook_output import allow_pass


def count_code_lines(content: str) -> int:
    """Count non-empty, non-comment lines."""
    count = 0
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        count += 1
    return count


def deny_solid_violation(file_path: str, violations: list[str]) -> None:
    """Output deny decision for SOLID violation and exit."""
    reason = f"SOLID VIOLATION in {file_path}: " + " ".join(violations)
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    for target in iter_edit_targets(data):
        file_path = target.get("file_path", "")
        if not file_path.endswith(".php"):
            continue
        if "/vendor/" in file_path:
            continue

        content = target.get("content", "")
        if not content:
            continue

        line_count = count_code_lines(content)
        violations = []

        if line_count > 100:
            violations.append(
                f"File has {line_count} lines (limit: 100). "
                "Split using Services, Actions, or Traits."
            )

        if re.search(r"^interface ", content, re.MULTILINE):
            if "/Contracts/" not in file_path:
                violations.append(
                    "Interface defined outside Contracts/. "
                    "Move to app/Contracts/ or FuseCore/{Module}/App/Contracts/."
                )

        if "/Controllers/" in file_path and line_count > 80:
            violations.append(
                f"Fat controller ({line_count} lines). Extract logic to Services or Actions."
            )

        if violations:
            deny_solid_violation(file_path, violations)
    allow_pass("validate-laravel-solid", "SOLID ok")


if __name__ == "__main__":
    main()
