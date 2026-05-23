#!/usr/bin/env python3
"""PostToolUse hook: Track cumulative code file changes per session."""
import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared.state_manager import load_session_state, save_session_state
sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', '..', '..', '_shared', 'scripts')))
from edit_targets import iter_edit_targets  # pylint: disable=wrong-import-position

LOG_DIR = os.path.join(os.environ.get('CODEX_HOME', os.path.join(os.path.expanduser('~'), '.codex')), 'fusengine', 'logs')
LOG_FILE = os.path.join(LOG_DIR, 'hooks.log')
CODE_EXT = r'\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|vue|svelte|astro)$'


def log_hook(msg):
    """Append log entry."""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f'[{ts}] [PostToolUse/track-session-changes] {msg}\n')
    except OSError:
        pass


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        log_hook('ERROR: Invalid JSON')
        sys.exit(0)

    targets = [
        t.get('file_path', '') for t in iter_edit_targets(data)
        if re.search(CODE_EXT, t.get('file_path', ''))
    ]
    if not targets:
        sys.exit(0)

    sid = data.get('session_id', '') or 'unknown'
    state = load_session_state(sid)
    changes = state.setdefault('changes', {
        'cumulativeCodeFiles': 0, 'modifiedFiles': [],
    })

    count = changes.get('cumulativeCodeFiles', 0)
    files = changes.get('modifiedFiles', [])
    for fp in targets:
        log_hook(f'Code file detected: {fp}')
        if fp not in files:
            count += 1
            files.append(fp)
            log_hook(f'Count: {count} (new: {fp})')

    ts = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    changes.update({
        'cumulativeCodeFiles': count,
        'modifiedFiles': files,
        'lastModifiedFile': targets[-1],
        'lastCheck': ts,
    })
    state['changes'] = changes
    save_session_state(sid, state)

    log_hook(f'State saved: {count} file(s)')
    names = ', '.join(os.path.basename(fp) for fp in targets)
    print(f"sniper required: {names}", file=sys.stderr)
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse",
        "additionalContext": f"SNIPER VALIDATION REQUIRED: Code file(s) '{names}' were modified. "
        f"You MUST now run the sniper agent (fuse-ai-pilot:sniper) to validate "
        f"this modification before continuing. This is mandatory per AGENTS.md rules."}}))
    sys.exit(0)


if __name__ == '__main__':
    main()
