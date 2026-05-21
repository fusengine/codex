#!/usr/bin/env python3
"""PreToolUse: Block UI code with Tailwind if Gemini Design MCP not called in session.
Handles Claude (Write/Edit file_path+content) and Codex (apply_patch V4A body)."""
import json
import re
import sys

UI_EXT = re.compile(r'\.(tsx|jsx|vue|svelte)$')
EXEMPT_DIRS = re.compile(r'(node_modules|dist|build|\.next|\.codex)/')

TAILWIND_PATTERNS = [
    r'\bflex\b', r'\bgrid\b', r'\bp-\d', r'\bpx-\d', r'\bpy-\d',
    r'\bm-\d', r'\bmx-\d', r'\bmy-\d', r'\bmt-\d', r'\bmb-\d',
    r'\bbg-\w+', r'\btext-\w+', r'\brounded', r'\bshadow',
    r'\bborder\b', r'\bgap-\d', r'\bw-\w+', r'\bh-\w+',
    r'\bjustify-\w+', r'\bitems-\w+', r'\bspace-\w+-\d',
]

GEMINI_PREFIX = 'mcp__gemini-design__'
MIN_TAILWIND_CLASSES = 3
MIN_LINES_FOR_EDIT = 2

BLOCK_MSG = (
    "BLOCKED: UI code with Tailwind detected but Gemini Design MCP not used.\n"
    "Use mcp__gemini-design__create_frontend, modify_frontend, or "
    "snippet_frontend BEFORE writing UI code manually.\n"
    "NEVER write Tailwind classes by hand — always use Gemini Design MCP first."
)


def count_tailwind(content):
    return sum(1 for p in TAILWIND_PATTERNS if re.search(p, content))


def gemini_was_called(transcript_path):
    try:
        with open(transcript_path, 'r', encoding='utf-8') as fh:
            for line in fh:
                try:
                    entry = json.loads(line.strip())
                    for block in entry.get('message', {}).get('content', []):
                        if block.get('type') == 'tool_use' and block.get('name', '').startswith(GEMINI_PREFIX):
                            return True
                except (json.JSONDecodeError, AttributeError):
                    continue
    except (OSError, IOError):
        return False
    return False


def edits_in(tool, ti):
    """Yield (path, content_added, is_edit) tuples."""
    if tool == 'apply_patch':
        body = ti.get('command') or ti.get('input') or ''
        p, a, buf = None, None, []
        for line in body.splitlines():
            h = re.match(r'^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$', line)
            if h:
                if p and a in ('add', 'update'):
                    yield (p, '\n'.join(buf), a == 'update')
                a, p, buf = h.group(1).lower(), h.group(2).strip(), []
            elif a in ('add', 'update') and line.startswith('+') and not line.startswith('+++'):
                buf.append(line[1:])
        if p and a in ('add', 'update'):
            yield (p, '\n'.join(buf), a == 'update')
    else:
        fp = ti.get('file_path', '')
        content = ti.get('content') or ti.get('new_string') or ''
        if fp and content:
            yield (fp, content, tool == 'Edit')


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    if data.get('agent_id'):
        sys.exit(0)
    transcript = data.get('transcript_path', '')
    for fp, content, is_edit in edits_in(data.get('tool_name', ''), data.get('tool_input', {})):
        if not UI_EXT.search(fp) or EXEMPT_DIRS.search(fp):
            continue
        if is_edit and content.count('\n') < MIN_LINES_FOR_EDIT:
            continue
        if count_tailwind(content) < MIN_TAILWIND_CLASSES:
            continue
        if transcript and gemini_was_called(transcript):
            continue
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": BLOCK_MSG,
        }}))
        return
    sys.exit(0)


if __name__ == '__main__':
    main()
