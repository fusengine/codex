#!/usr/bin/env python3
"""PreToolUse: Block design-expert from writing non-HTML/CSS files."""
import json, os, re, sys

_SHARED = os.path.abspath(os.path.join(os.environ.get("PLUGIN_ROOT", os.getcwd()), "..", "_shared", "scripts"))
sys.path.insert(0, _SHARED)
from hook_output import allow_pass
from edit_targets import iter_edit_targets

CACHE_DIR = os.path.join(os.environ.get("CODEX_HOME", os.path.join(os.path.expanduser("~"), ".codex")), "fusengine")
FLAG_FILE = os.path.join(CACHE_DIR, "design-agent-active")
ALLOWED_EXT = re.compile(r'\.(html|css|md|json)$')
EXEMPT_DIRS = ("node_modules/", "dist/", "build/", ".codex/")

DENY_MSG = (
    "BLOCKED: design-expert can only write .html, .css, .md, and .json files. "
    "Framework files (.tsx, .astro, .vue, .swift, .php) must be written by "
    "the domain expert (astro-expert, react-expert, etc.) AFTER design validation.")


def main() -> None:
    """Block non-HTML/CSS writes when design-expert is active."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)
    if not os.path.isfile(FLAG_FILE):
        sys.exit(0)
    try:
        with open(FLAG_FILE) as f:
            design_agent_id = f.read().strip()
    except OSError:
        sys.exit(0)
    current_agent_id = data.get("agent_id") or ""
    if not current_agent_id:
        sys.exit(0)
    if design_agent_id and current_agent_id != design_agent_id:
        sys.exit(0)
    checked = False
    for target in iter_edit_targets(data):
        fp = target.get("file_path", "")
        if not fp or any(d in fp for d in EXEMPT_DIRS):
            continue
        checked = True
        if not ALLOWED_EXT.search(fp):
            print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
                "permissionDecision": "deny", "permissionDecisionReason": DENY_MSG}}))
            return
    if checked:
        allow_pass("enforce-html-css-only", "allowed design files")


if __name__ == "__main__":
    main()
