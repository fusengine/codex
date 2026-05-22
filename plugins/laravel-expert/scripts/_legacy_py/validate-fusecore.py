#!/usr/bin/env python3
"""validate-fusecore.py - PreToolUse hook: FuseCore modular enforcement.

When FuseCore/ exists, domain code MUST be in FuseCore/{Module}/, not app/.
Cross-module imports blocked (only FuseCore/Core/ allowed).
"""

import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from check_skill_common import deny_block, find_project_root
from edit_targets import iter_edit_targets
from hook_output import allow_pass
from modular_detection import is_fusecore_project

_BLOCKED_IN_APP = (
    "/app/Models/", "/app/Services/", "/app/Actions/",
    "/app/Http/Controllers/", "/app/Http/Requests/",
    "/app/Http/Resources/", "/app/Contracts/",
    "/app/DTOs/", "/app/Repositories/",
    "/app/Events/", "/app/Listeners/", "/app/Jobs/",
    "/app/Notifications/", "/app/Policies/",
)


def main() -> None:
    """Main entry point."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)
    for target in iter_edit_targets(data):
        fp = target.get("file_path", "")
        if not fp.endswith(".php"):
            continue
        if re.search(r"/(vendor|storage|bootstrap/cache)/", fp):
            continue
        root = find_project_root(
            os.path.dirname(fp), "composer.json", "artisan", ".git")
        if not is_fusecore_project(root):
            continue

        # Block domain code in app/ — must use FuseCore/{Module}/
        for blocked in _BLOCKED_IN_APP:
            if blocked in fp:
                target_path = blocked.replace("/app/", "/FuseCore/{Module}/App/")
                deny_block(
                    f"BLOCKED: FuseCore project. Code in '{blocked.strip('/')}'"
                    f" FORBIDDEN. Move to '{target_path.strip('/')}'.")

        # Validate module.json exists for FuseCore modules
        mod = re.search(r"/FuseCore/([A-Za-z]+)/", fp)
        if mod:
            mj = os.path.join(root, "FuseCore", mod.group(1), "module.json")
            if not os.path.isfile(mj):
                deny_block(f"BLOCKED: Module '{mod.group(1)}' missing "
                           f"module.json. Create {mj} first.")

        # Block cross-module imports (FuseCore/A/ -> FuseCore/B/)
        content = target.get("content", "")
        if mod and mod.group(1) != "Core":
            current = mod.group(1)
            cross = re.findall(r"use\s+FuseCore\\(\w+)\\", content)
            for imported in cross:
                if imported != current and imported != "Core":
                    deny_block(
                        f"BLOCKED: Cross-module import. '{current}' uses "
                        f"'{imported}'. Only FuseCore\\Core\\ allowed.")

        # Block Core importing from feature modules
        if mod and mod.group(1) == "Core":
            cross = re.findall(r"use\s+FuseCore\\(\w+)\\", content)
            for imported in cross:
                if imported != "Core":
                    deny_block(
                        f"BLOCKED: FuseCore\\Core\\ must NOT import from "
                        f"FuseCore\\{imported}\\. Core must be independent.")

    allow_pass("validate-fusecore", "FuseCore structure ok")


if __name__ == "__main__":
    main()
