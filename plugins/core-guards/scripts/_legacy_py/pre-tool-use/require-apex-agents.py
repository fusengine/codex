#!/usr/bin/env python3
"""PreToolUse: Block code writes if explore-codebase + research-expert not called (2min TTL).
Handles Claude (Write/Edit file_path) and Codex (apply_patch V4A body)."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apex_agent_helpers import (  # pylint: disable=wrong-import-position
    check_brainstorm_done,
    check_required_agents,
)
sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', '..', '..', '_shared', 'scripts')))
from hook_output import emit_pre_tool  # pylint: disable=wrong-import-position,import-error

CODE_EXT = r'\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$'
EXEMPT_PATTERNS = [
    r'\.claude-plugin/', r'\.codex-plugin/', r'CHANGELOG\.md$', r'marketplace\.json$',
    r'/\.claude/(apex|memory|logs|fusengine)/',
    r'/\.codex/(apex|memory|fusengine)/',
]


def files_in(tool, ti):
    """Yield (path, is_new) from Claude or Codex tool_input."""
    if tool == 'apply_patch':
        for line in (ti.get('command') or ti.get('input') or '').splitlines():
            h = re.match(r'^\*\*\*\s+(Add|Update) File:\s+(.+)$', line)
            if h:
                yield (h.group(2).strip(), h.group(1) == 'Add')
    else:
        fp = ti.get('file_path', '')
        if fp:
            yield (fp, tool != 'Edit')


def deny(reason):
    emit_pre_tool("deny", reason, script_name="require-apex-agents")
    sys.exit(0)


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    tool = data.get('tool_name', '')
    sid = data.get('session_id', '') or 'unknown'
    is_subagent = bool(data.get('agent_id'))

    for fp, is_new in files_in(tool, data.get('tool_input', {})):
        if not re.search(CODE_EXT, fp):
            continue
        if any(re.search(p, fp) for p in EXEMPT_PATTERNS):
            continue
        if is_new and not is_subagent and not check_brainstorm_done(sid):
            deny("BLOCKED: Brainstorming required for new feature/creation task. "
                 "Launch brainstorming agent BEFORE writing code.")
        satisfied, missing = check_required_agents(sid)
        if satisfied:
            continue
        missing_str = ' + '.join(missing)
        if is_subagent:
            hints = []
            for m in missing:
                if 'explore' in m:
                    hints.append('Glob/Grep (codebase exploration)')
                if 'research' in m:
                    hints.append('Context7/Exa/WebSearch (research)')
            deny(f"BLOCKED: APEX workflow required (2min TTL). "
                 f"Missing: {missing_str}. Use {' and '.join(hints)} BEFORE editing code.")
        else:
            deny(f"BLOCKED: APEX workflow required (2min TTL). "
                 f"Missing agents: {missing_str}. "
                 f"Launch BOTH explore-codebase AND research-expert BEFORE editing code.")
    sys.exit(0)


if __name__ == '__main__':
    main()
