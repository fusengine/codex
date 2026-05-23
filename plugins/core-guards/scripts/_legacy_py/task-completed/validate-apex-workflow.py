#!/usr/bin/env python3
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared.state_manager import load_session_state

MAX_LINES = 100
CODE_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.php',
    '.cpp', '.c', '.rb', '.swift', '.kt', '.vue', '.svelte', '.astro',
}


def changed_code_files(state):
    changes = state.get('changes', {})
    modified = changes.get('modifiedFiles', []) if isinstance(changes, dict) else []
    if not modified and isinstance(state.get('modifiedFiles'), list):
        modified = state['modifiedFiles']
    return [
        fp for fp in modified
        if os.path.splitext(str(fp))[1] in CODE_EXTENSIONS
    ]


def agent_recorded(state, needle):
    for entry in state.get('agents', []):
        if not isinstance(entry, dict):
            continue
        quality = entry.get('quality')
        if needle in str(entry.get('type', '')) and quality == 'sufficient':
            return True
    return False


def sniper_recorded(state):
    for entry in state.get('agents', []):
        if not isinstance(entry, dict):
            continue
        if entry.get('quality') != 'sufficient':
            continue
        if 'sniper' in ' '.join(str(entry.get(key, '')) for key in (
            'type', 'prompt_preview', 'tool_name')).lower():
            return True
    return False


def files_over_limit(paths):
    violations = []
    for fp in paths:
        if not os.path.isfile(fp):
            continue
        try:
            with open(fp, encoding='utf-8') as handle:
                count = sum(1 for _ in handle)
        except OSError:
            continue
        if count > MAX_LINES:
            violations.append(f"{os.path.basename(fp)}: {count} lines")
    return violations


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    state = load_session_state(data.get('session_id', '') or 'unknown')
    files = changed_code_files(state)
    if not files:
        sys.exit(0)

    missing = []
    if not agent_recorded(state, 'explore-codebase'):
        missing.append('explore-codebase before coding')
    if not agent_recorded(state, 'research-expert'):
        missing.append('research-expert before coding')
    if not sniper_recorded(state):
        missing.append('sniper validation after modifications')

    too_long = files_over_limit(files)
    if too_long:
        missing.append(f"files over {MAX_LINES} lines: " + '; '.join(too_long[:5]))

    if missing:
        reason = 'APEX WORKFLOW WARNING: Missing step: ' + '; '.join(missing)
        if data.get('stop_hook_active'):
            print(json.dumps({"systemMessage": reason}))
        else:
            print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


if __name__ == '__main__':
    main()
