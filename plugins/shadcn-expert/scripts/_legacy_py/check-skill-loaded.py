#!/usr/bin/env python3
"""check-skill-loaded.py - PreToolUse hook for shadcn skill enforcement.

Phase 1: Base shadcn skill check (shadcn-detection or shadcn-components).
Phase 2: Domain-specific skill check via shadcn_skill_triggers.
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
from shadcn_skill_triggers import detect_required_skills, specific_skill_consulted

PLUGINS_DIR = os.path.expanduser(
    "~/.codex/plugins/cache/fusengine-codex")


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    target = first_edit_target(data, r"\.(tsx|jsx|css|scss|json)$",
                               r"/(node_modules|dist|build)/")
    if not target:
        sys.exit(0)
    file_path = target["file_path"]
    if not re.search(r"(components|ui|shadcn|components\.json)", file_path):
        sys.exit(0)

    content = target["content"]
    session_id = data.get("session_id") or f"fallback-{os.getpid()}"
    project_root = find_project_root(
        os.path.dirname(file_path), "package.json", ".git")

    # Phase 1: Base shadcn skill
    if not skill_was_consulted("shadcn", session_id, project_root):
        deny_block(
            "BLOCKED: shadcn skill not consulted. READ ONE: "
            f"1) {PLUGINS_DIR}/shadcn-expert/skills/shadcn-detection/SKILL.md"
            f" | 2) {PLUGINS_DIR}/shadcn-expert/skills/shadcn-components/SKILL.md"
            " | 3) Use mcp__shadcn__search_items_in_registries. After reading, retry.")

    # Phase 2: Domain skills (component/UI/config files)
    required = detect_required_skills(content)
    missing = [s for s in required
               if not specific_skill_consulted(s, session_id)]
    if missing:
        paths = " | ".join(
            f"{PLUGINS_DIR}/shadcn-expert/skills/{s}/SKILL.md"
            for s in missing)
        deny_block(f"BLOCKED: Code uses {', '.join(missing)} but "
                   f"skill(s) not consulted. READ: {paths}")

    # Phase 3: MCP research (Context7 AND Exa must be consulted)
    if not mcp_research_done(session_id):
        deny_block(
            "BLOCKED: No MCP research done. Use BOTH: "
            "1) mcp__context7__query-docs AND "
            "2) mcp__exa__web_search_exa before writing code.")

    allow_pass("check-shadcn-skill",
               f"pass (domain: {required or 'base'})")


if __name__ == "__main__":
    main()
