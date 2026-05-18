#!/usr/bin/env python3
"""PreToolUse: block writes that would push code files past 100 lines.
Handles Claude (Write/Edit, tool_input.file_path) and Codex (apply_patch,
tool_input.command = raw V4A body)."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', '..', '..', '_shared', 'scripts')))
from hook_output import emit_pre_tool  # pylint: disable=wrong-import-position,import-error

CODE_EXT = r'\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$'
MAX = 100


def solid_ref(fp):
    ext = fp.rsplit('.', 1)[-1] if '.' in fp else ''
    if ext in ('ts', 'tsx', 'js', 'jsx'):
        d = os.path.dirname(fp)
        nx = any(os.path.isfile(os.path.join(d, c)) for c in ('next.config.js', 'next.config.ts'))
        return 'nextjs-expert/skills/solid-nextjs/' if nx else 'react-expert/skills/solid-react/'
    return {'php': 'laravel-expert/skills/solid-php/',
            'swift': 'swift-apple-expert/skills/solid-swift/'}.get(ext, 'generic/')


def parse_v4a(body):
    """Yield (action, path, added_lines) from a V4A apply_patch body."""
    p, a, n = None, None, 0
    for line in body.splitlines():
        h = re.match(r'^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$', line)
        if h:
            if p:
                yield (a, p, n)
            a, p, n = h.group(1).lower(), h.group(2).strip(), 0
        elif a in ('add', 'update') and line.startswith('+') and not line.startswith('+++'):
            n += 1
    if p:
        yield (a, p, n)


def deny(path, proj):
    if not path or not re.search(CODE_EXT, path) or proj <= MAX:
        return None
    return (f"BLOCKED: '{os.path.basename(path)}' would be {proj} lines (max {MAX}). "
            f"Read SOLID at ~/.codex/plugins/cache/fusengine-codex/{solid_ref(path)} "
            f"and split into modules <90 lines.")


def projected(action, path, adds):
    if action == 'add':
        return adds
    cur = sum(1 for _ in open(path, encoding='utf-8')) if os.path.isfile(path) else 0
    return cur + adds


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    if data.get('agent_type') in ('Explore', 'Plan'):
        sys.exit(0)
    tool = data.get('tool_name', '')
    ti = data.get('tool_input', {})
    reasons = []
    if tool == 'apply_patch':
        body = ti.get('command') or ti.get('input') or ti.get('patch') or ''
        for action, path, adds in parse_v4a(body):
            if action == 'delete':
                continue
            r = deny(path, projected(action, path, adds))
            if r:
                reasons.append(r)
    else:
        fp = ti.get('file_path', '')
        content = ti.get('new_string') or ti.get('content') or ''
        proj = (content.count('\n') + 1) if (tool == 'Write' and content) else (
            sum(1 for _ in open(fp, encoding='utf-8')) if os.path.isfile(fp) else 0)
        r = deny(fp, proj)
        if r:
            reasons.append(r)
    if reasons:
        emit_pre_tool("deny", ' | '.join(reasons), script_name="enforce-file-size")
    sys.exit(0)


if __name__ == '__main__':
    main()
