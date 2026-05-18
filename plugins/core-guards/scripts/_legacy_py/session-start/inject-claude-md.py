#!/usr/bin/env python3
"""SessionStart hook: Inject AGENTS.md via hookSpecificOutput."""
import json
import os
import sys
from datetime import datetime

LOG_DIR = os.path.join(os.environ.get('CODEX_HOME', os.path.join(os.path.expanduser('~'), '.codex')), 'fusengine', 'logs')
LOG_FILE = os.path.join(LOG_DIR, 'hooks.log')


def log(msg):
    """Log with timestamp."""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(f'[{ts}] [SessionStart/inject-claude-md] {msg}\n')
    except OSError:
        pass


def main():
    claude_md = os.path.expanduser('~/.codex/AGENTS.md')
    if not os.path.isfile(claude_md):
        log(f'ERROR: AGENTS.md not found at {claude_md}')
        sys.exit(0)

    try:
        with open(claude_md, encoding='utf-8') as f:
            content = f.read()
    except OSError:
        log('ERROR: Cannot read AGENTS.md')
        sys.exit(0)

    lines = content.count('\n') + 1
    log('Injecting AGENTS.md into session context')
    print(f'AGENTS.md loaded ({lines} lines)', file=sys.stderr)

    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": content
    }}))

    log(f'AGENTS.md injected successfully ({lines} lines)')
    sys.exit(0)


if __name__ == '__main__':
    main()
