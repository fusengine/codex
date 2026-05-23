#!/usr/bin/env python3
import json, os, re, sys, time
from datetime import datetime, timezone
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '_shared', 'scripts'))
from ref_router import route_references
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from _shared.state_manager import load_session_state, save_session_state
CODE_EXT = r'\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$'
FW_MAP = {'php': 'php', 'swift': 'swift', 'java': 'java', 'go': 'go', 'rb': 'ruby', 'rs': 'rust'}
SKILL_MAP = {'react': 'react-expert/skills/solid-react', 'nextjs': 'nextjs-expert/skills/solid-nextjs',
             'php': 'laravel-expert/skills/solid-php', 'swift': 'swift-apple-expert/skills/solid-swift',
             'generic': 'solid/skills/solid-generic', 'java': 'solid/skills/solid-java',
             'go': 'solid/skills/solid-go', 'ruby': 'solid/skills/solid-ruby', 'rust': 'solid/skills/solid-rust'}
P = '~/.codex/plugins/cache/fusengine-codex'
def resolve_skill_dir(skill):
    base = os.path.expanduser(P)
    parts = skill.split('/', 1)
    if len(parts) != 2:
        return os.path.join(base, skill)
    plugin, rest = parts
    legacy = os.path.join(base, plugin, rest)
    if os.path.isdir(legacy):
        return legacy
    root = os.path.join(base, plugin)
    try:
        versions = sorted(v for v in os.listdir(root) if os.path.isdir(os.path.join(root, v, rest)))
    except OSError:
        return legacy
    return os.path.join(root, versions[-1], rest) if versions else legacy
def framework(fp):
    ext = fp.rsplit('.', 1)[-1] if '.' in fp else ''
    if ext in ('ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'):
        d = os.path.dirname(fp)
        nx = any(os.path.isfile(os.path.join(d, c)) for c in ('next.config.js', 'next.config.ts', 'next.config.mjs'))
        return 'nextjs' if nx else 'react'
    return FW_MAP.get(ext, '')
def already_read(sid, fw):
    for r in reversed(load_session_state(sid).get('solid_reads', [])):
        if r.get('framework') != fw:
            continue
        try:
            t = datetime.strptime(r.get('timestamp', ''), '%Y-%m-%dT%H:%M:%SZ')
            return (time.time() - t.replace(tzinfo=timezone.utc).timestamp()) < 120
        except ValueError:
            return False
    return False
def build_reason(fp, fw, skill, routed):
    skill_dir = resolve_skill_dir(skill)
    if not routed:
        return f"BLOCKED: Read SOLID first (2min): {skill_dir}/SKILL.md"
    ln = [f"BLOCKED: Read SOLID refs (2min) for {fw}.", f"Editing: {fp}", "Required:"]
    for i, r in enumerate(routed['required'], 1):
        ln.append(f"  {i}. {r['meta']['filePath']}")
    if routed.get('optional'):
        ln.append("Optional:")
        for i, r in enumerate(routed['optional'], len(routed['required']) + 1):
            ln.append(f"  {i}. {r['meta']['filePath']}")
    ln.append(f"Full: {skill_dir}/SKILL.md")
    return '\n'.join(ln)
def files_in(tool, ti):
    if tool == 'apply_patch':
        for line in (ti.get('command') or ti.get('input') or '').splitlines():
            h = re.match(r'^\*\*\*\s+(Add|Update) File:\s+(.+)$', line)
            if h:
                yield h.group(2).strip()
    else:
        fp = ti.get('file_path', '')
        if fp:
            yield fp
def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)
    tool = data.get('tool_name', '')
    sid = data.get('session_id', '')
    for fp in files_in(tool, data.get('tool_input', {})):
        if not re.search(CODE_EXT, fp):
            continue
        fw = framework(fp)
        if not fw or already_read(sid, fw):
            continue
        state = load_session_state(sid)
        ts = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')
        state['target'] = {'project': os.path.dirname(fp), 'framework': fw,
                           'set_by': 'require-solid-read.py', 'set_at': ts}
        save_session_state(sid, state)
        skill = SKILL_MAP.get(fw, '')
        routed = route_references(fp, '', resolve_skill_dir(skill))
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse",
            "permissionDecision": "deny", "permissionDecisionReason": build_reason(fp, fw, skill, routed)}}))
        sys.exit(0)
    sys.exit(0)
if __name__ == '__main__':
    main()
