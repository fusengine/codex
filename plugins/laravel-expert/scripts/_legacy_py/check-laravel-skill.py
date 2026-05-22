#!/usr/bin/env python3
"""check-laravel-skill.py - PreToolUse hook for Laravel skill enforcement.

Phase 1: Base Laravel skill check (solid-php or laravel-eloquent).
Phase 2: Domain-specific skill check via laravel_skill_triggers.
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
from laravel_skill_triggers import detect_required_skills, specific_skill_consulted
from modular_detection import is_fusecore_project

PLUGINS_DIR = os.path.expanduser(
    "~/.codex/plugins/cache/fusengine-codex")


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    target = first_edit_target(data, r"\.php$",
                               r"/(vendor|storage|bootstrap/cache)/")
    if not target:
        sys.exit(0)
    file_path = target["file_path"]

    content = target["content"]
    session_id = data.get("session_id") or f"fallback-{os.getpid()}"
    project_root = find_project_root(
        os.path.dirname(file_path), "composer.json", "artisan", ".git")

    # Phase 1: Base Laravel skill
    if not skill_was_consulted("laravel", session_id, project_root):
        deny_block(
            "BLOCKED: Laravel skill not consulted. READ ONE: "
            f"1) {PLUGINS_DIR}/laravel-expert/skills/solid-php/SKILL.md"
            f" | 2) {PLUGINS_DIR}/laravel-expert/skills/laravel-eloquent/SKILL.md"
            " | 3) Use mcp__context7__query-docs. After reading, retry.")

    # Phase 1.5: FuseCore module skill enforcement
    if is_fusecore_project(project_root):
        if not specific_skill_consulted("fusecore", session_id):
            deny_block(
                "BLOCKED: FuseCore project detected. READ: "
                f"{PLUGINS_DIR}/laravel-expert/skills/fusecore/SKILL.md "
                "BEFORE writing code in FuseCore modules.")

    # Phase 2: Domain skills (all .php files)
    required = detect_required_skills(content)
    missing = [s for s in required
               if not specific_skill_consulted(s, session_id)]
    if missing:
        paths = " | ".join(
            f"{PLUGINS_DIR}/laravel-expert/skills/{s}/SKILL.md"
            for s in missing)
        deny_block(f"BLOCKED: Code uses {', '.join(missing)} but "
                   f"skill(s) not consulted. READ: {paths}")

    # Phase 3: MCP research (Context7 AND Exa must be consulted)
    if not mcp_research_done(session_id):
        deny_block(
            "BLOCKED: No MCP research done. Use BOTH: "
            "1) mcp__context7__query-docs AND "
            "2) mcp__exa__web_search_exa before writing code.")

    allow_pass("check-laravel-skill",
               f"pass (domain: {required or 'base'})")


if __name__ == "__main__":
    main()
