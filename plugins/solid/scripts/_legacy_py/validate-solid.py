#!/usr/bin/env python3
"""PreToolUse hook - Validate SOLID principles before writing files."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts")))
from edit_targets import iter_edit_targets


def deny_solid(reason):
    """Output deny decision and exit."""
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def check_nextjs(file_path, content):
    """Validate Next.js SOLID rules."""
    has_iface = re.search(r"^(export )?(interface|type) ", content, re.MULTILINE)
    if "/components/" in file_path and has_iface:
        deny_solid("SOLID: Interfaces must be in modules/cores/interfaces/, not components")
    if "/app/" in file_path and file_path.endswith(".tsx") and has_iface:
        deny_solid("SOLID: Interfaces must be in modules/cores/interfaces/, not app/")


def check_laravel(file_path, content):
    """Validate Laravel SOLID rules."""
    if file_path.endswith(".php") and "/Contracts/" not in file_path:
        if re.search(r"^interface ", content, re.MULTILINE):
            deny_solid("SOLID: Interfaces must be in app/Contracts/")


def check_swift(file_path, content):
    """Validate Swift SOLID rules."""
    if file_path.endswith(".swift") and "/Protocols/" not in file_path:
        if re.search(r"^protocol ", content, re.MULTILINE):
            deny_solid("SOLID: Protocols must be in Protocols/")


def check_go(file_path, content):
    """Validate Go SOLID rules."""
    if file_path.endswith(".go") and "/interfaces/" not in file_path:
        if re.search(r"^type.*interface \{", content, re.MULTILINE):
            deny_solid("SOLID: Interfaces must be in internal/interfaces/")


def check_python(file_path, content):
    """Validate Python SOLID rules."""
    if file_path.endswith(".py") and "/interfaces/" not in file_path:
        if re.search(r"class.*ABC", content):
            deny_solid("SOLID: Abstract classes must be in src/interfaces/")


def main():
    """Validate SOLID principles based on project type."""
    ptype = os.environ.get("SOLID_PROJECT_TYPE", "")
    if not ptype or ptype == "unknown":
        sys.exit(0)

    data = json.load(sys.stdin)
    validators = {
        "nextjs": check_nextjs, "laravel": check_laravel,
        "swift": check_swift, "go": check_go, "python": check_python,
    }
    validator = validators.get(ptype)
    if validator:
        for target in iter_edit_targets(data):
            file_path = target.get("file_path", "")
            content = target.get("content", "")
            if file_path and content:
                validator(file_path, content)

    sys.exit(0)


if __name__ == "__main__":
    main()
