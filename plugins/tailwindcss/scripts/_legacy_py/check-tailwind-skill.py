#!/usr/bin/env python3
"""check-tailwind-skill.py - PreToolUse hook for Tailwind skill enforcement.

Phase 1: Base Tailwind skill check (tailwindcss-v4 or tailwindcss-utilities).
Phase 2: Domain-specific skill check via tailwind_skill_triggers.
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_skill_common import (
    deny_block, find_project_root, first_edit_target, mcp_research_done,
    skill_was_consulted)
from hook_output import allow_pass
from skill_paths import skill_md
from tailwind_skill_triggers import detect_required_skills, specific_skill_consulted

PLUGINS_DIR = os.path.expanduser(
    "~/.codex/plugins/cache/fusengine-codex")
TW_PATTERN = r"(className|class).*['\"].*\b(flex|grid|p-|m-|w-|h-|text-|bg-|border-)"


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    target = first_edit_target(data, r"\.(tsx|jsx|css|html)$",
                               r"/(node_modules|dist|build)/")
    if not target:
        sys.exit(0)
    file_path = target["file_path"]

    # Vanilla HTML/CSS files: skip Tailwind skill checks
    # Design-expert generates HTML/CSS without Tailwind
    if re.search(r'\.(html|css)$', file_path):
        sys.exit(0)

    content = target["content"]
    if not re.search(TW_PATTERN, content):
        sys.exit(0)

    session_id = data.get("session_id") or f"fallback-{os.getpid()}"
    project_root = find_project_root(
        os.path.dirname(file_path),
        "tailwind.config.js", "tailwind.config.ts", "package.json")

    # Phase 1: Base Tailwind skill
    if not skill_was_consulted("tailwind", session_id, project_root):
        deny_block(
            "BLOCKED: Tailwind skill not consulted. READ ONE: "
            f"1) {skill_md('tailwindcss', 'tailwindcss-v4')}"
            f" | 2) {skill_md('tailwindcss', 'tailwindcss-utilities')}"
            " | 3) Use mcp__context7__query-docs (topic: tailwindcss). After reading, retry.")

    # Phase 2: Domain skills (utility category detection)
    required = detect_required_skills(content)
    missing = [s for s in required
               if not specific_skill_consulted(s, session_id)]
    if missing:
        paths = " | ".join(
            f"{skill_md('tailwindcss', s)}"
            for s in missing)
        deny_block(f"BLOCKED: Code uses {', '.join(missing)} but "
                   f"skill(s) not consulted. READ: {paths}")

    # Phase 3: MCP research (Context7 AND Exa must be consulted)
    if not mcp_research_done(session_id):
        deny_block(
            "BLOCKED: No MCP research done. Use BOTH: "
            "1) mcp__context7__query-docs AND "
            "2) mcp__exa__web_search_exa before writing code.")

    allow_pass("check-tailwind-skill",
               f"pass (domain: {required or 'base'})")


if __name__ == "__main__":
    main()
