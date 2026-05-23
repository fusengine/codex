#!/usr/bin/env python3
"""Runtime tests for Codex shell skill-read extraction."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from shell_read_paths import skill_doc_path_from_payload  # noqa: E402

ROOT = "/repo"
SKILL = "/repo/plugins/react-expert/skills/react-19/SKILL.md"

CASES = [
    ({"tool_name": "Read", "tool_input": {"file_path": SKILL}}, SKILL, "read tool"),
    ({"tool_name": "Bash", "tool_input": {"command": f"sed -n '1,80p' {SKILL}"}}, SKILL, "sed absolute"),
    ({"tool_name": "Bash", "cwd": ROOT, "tool_input": {"command": "cat plugins/react-expert/skills/react-19/SKILL.md"}}, SKILL, "cat relative"),
    ({"tool_name": "Bash", "tool_input": {"command": f"rg hooks {SKILL}"}}, SKILL, "rg absolute"),
    ({"tool_name": "Bash", "tool_input": {"command": "python3 script.py"}}, "", "non-read shell"),
]

failures = 0
for payload, expected, label in CASES:
    actual = skill_doc_path_from_payload(payload)
    ok = actual == expected
    print(f"{'OK  ' if ok else 'FAIL'} [{label}]: {actual!r}")
    failures += 0 if ok else 1

sys.exit(1 if failures else 0)
