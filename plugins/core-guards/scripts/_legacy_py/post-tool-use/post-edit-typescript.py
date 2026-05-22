#!/usr/bin/env python3
"""PostToolUse hook: Report eslint/prettier issues on edited TS/TSX files.

Reports lint errors as additionalContext so Claude can fix them.
Never modifies files (no --fix, no --write).
"""
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..", "..", "_shared", "scripts")))
from edit_targets import iter_edit_targets

TS_EXTENSIONS = ('.ts', '.tsx')
TIMEOUT_SEC = 10


def main():
    """Read stdin JSON, run linters in report mode, output issues."""
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    file_paths = [
        target.get('file_path', '')
        for target in iter_edit_targets(data)
        if target.get('file_path', '').endswith(TS_EXTENSIONS)
        and os.path.isfile(target.get('file_path', ''))
    ]
    if not file_paths:
        sys.exit(0)

    issues = []

    if shutil.which('eslint'):
        for file_path in file_paths:
            try:
                result = subprocess.run(
                    ['eslint', '--no-fix', '--format', 'compact', file_path],
                    capture_output=True, text=True, timeout=TIMEOUT_SEC,
                    check=False,
                )
                if result.returncode != 0 and result.stdout.strip():
                    issues.append(f"ESLint:\n{result.stdout.strip()}")
            except (subprocess.TimeoutExpired, OSError):
                pass

    if shutil.which('prettier'):
        for file_path in file_paths:
            try:
                result = subprocess.run(
                    ['prettier', '--check', file_path],
                    capture_output=True, text=True, timeout=TIMEOUT_SEC,
                    check=False,
                )
                if result.returncode != 0:
                    issues.append(
                        f"Prettier: {os.path.basename(file_path)} needs formatting"
                    )
            except (subprocess.TimeoutExpired, OSError):
                pass

    if issues:
        report = ' | '.join(issues)
        names = ', '.join(os.path.basename(fp) for fp in file_paths)
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": (
                    f"Lint issues in {names}: {report}"
                )
            }
        }))

    sys.exit(0)


if __name__ == '__main__':
    main()
