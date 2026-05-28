#!/usr/bin/env python3
"""inject-rules.py - Inject all rules/*.md into session context.

Receives plugin root as first CLI argument.
"""

import glob
import json
import os
import sys


def read_event() -> str:
    """Read the triggering event from stdin; default to SessionStart.

    Codex deserializes the hook output against a per-event wire schema where
    hookEventName is a const (deny_unknown_fields), so the emitted name must
    match the actual event (SessionStart vs UserPromptSubmit) or the payload is
    rejected on the UserPromptSubmit path.
    """
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError, OSError):
        return "SessionStart"
    if not isinstance(data, dict):
        return "SessionStart"
    event = data.get("hook_event_name", "")
    return event if event in ("SessionStart", "UserPromptSubmit") else "SessionStart"


def main() -> None:
    """Main entry for SessionStart/UserPromptSubmit rules injection."""
    if len(sys.argv) < 2:
        print("Missing plugin root argument", file=sys.stderr)
        sys.exit(1)

    event = read_event()
    plugin_root = sys.argv[1]
    rules_dir = os.path.join(plugin_root, "rules")

    if not os.path.isdir(rules_dir):
        sys.exit(0)

    rules = sorted(glob.glob(os.path.join(rules_dir, "*.md")))
    if not rules:
        sys.exit(0)

    parts = []
    for rule_path in rules:
        try:
            with open(rule_path, encoding="utf-8") as f:
                parts.append(f.read())
        except OSError:
            continue

    if not parts:
        sys.exit(0)

    content = "\n\n".join(parts)
    count = len(parts)

    print(f"rules: {count} rules loaded ({event})", file=sys.stderr)

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": event,
                    "additionalContext": content,
                }
            }
        )
    )
    sys.exit(0)


if __name__ == "__main__":
    main()
