#!/usr/bin/env python3
"""PreToolUse: enforce separated contracts for typed code."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', '..', '..', '_shared', 'scripts')))
from interface_rules import contract_violation  # pylint: disable=wrong-import-position,import-error
from hook_output import emit_pre_tool  # pylint: disable=wrong-import-position,import-error

RULES = [
    (r'\.(tsx|jsx|vue|svelte)$', r'^(export )?(interface|type) [A-Z]',
     'Interface/type in component file. Move to src/interfaces/'),
    (r'(views?|controllers?|routes?)/.*\.py$', r'^class [A-Z].*(BaseModel|TypedDict|Protocol)',
     'Type class in view file. Move to src/interfaces/'),
    (r'(handlers?|controllers?)/.*\.go$', r'^type [A-Z].*interface',
     'Interface in handler file. Move to internal/interfaces/'),
    (r'(controllers?|handlers?)/.*\.(java|kt)$', r'^(public |private )?(interface|record) [A-Z]',
     'Interface in controller file. Move to interfaces/ package'),
    (r'(Controllers?|Handlers?)/.*\.php$', r'^(interface|class) [A-Z].*(Interface|DTO|Request)',
     'Interface in controller file. Move to Interfaces/ directory'),
    (r'(Views?|Components?)/.*\.swift$', r'^protocol [A-Z]',
     'Protocol in view file. Move to Protocols/ or Models/'),
]


def parse_v4a(body):
    """Yield (path, added_lines_text) from V4A apply_patch body."""
    p, a, buf = None, None, []
    for line in body.splitlines():
        h = re.match(r'^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$', line)
        if h:
            if p and a != 'delete':
                yield (p, '\n'.join(buf))
            a, p, buf = h.group(1).lower(), h.group(2).strip(), []
        elif a in ('add', 'update') and line.startswith('+') and not line.startswith('+++'):
            buf.append(line[1:])
    if p and a != 'delete':
        yield (p, '\n'.join(buf))


def deny(fp, content):
    reason = contract_violation(fp, content)
    if reason:
        return f"SOLID VIOLATION ({fp}): {reason}"
    for path_pat, content_pat, msg in RULES:
        if not re.search(path_pat, fp):
            continue
        for line in content.splitlines():
            if re.search(content_pat, line):
                return f"SOLID VIOLATION ({fp}): {msg}"
    return None


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    tool = data.get('tool_name', '')
    ti = data.get('tool_input', {})
    reasons = []
    if tool == 'apply_patch':
        body = ti.get('command') or ti.get('input') or ti.get('patch') or ''
        for path, added in parse_v4a(body):
            r = deny(path, added)
            if r:
                reasons.append(r)
    else:
        fp = ti.get('file_path', '')
        content = ti.get('content') or ti.get('new_string') or ''
        if fp and content:
            r = deny(fp, content)
            if r:
                reasons.append(r)
    if reasons:
        emit_pre_tool("deny", ' | '.join(reasons), script_name="enforce-interfaces")
    sys.exit(0)


if __name__ == '__main__':
    main()
