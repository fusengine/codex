---
name: hook-scripts
description: Codex hook script template notes
keywords: hooks, scripts, validation, codex
---

# Hook Script Notes

## Usage

Only use this reference when the user explicitly asks to create or modify hooks.

---

## Codex Placement

| Item | Location |
|------|----------|
| Hook config | `plugins/<plugin>/hooks/hooks.json` |
| Hook scripts | `plugins/<plugin>/scripts/` or `plugins/<plugin>/dist/hooks/` |
| Manifest pointer | `.codex-plugin/plugin.json` field `hooks` |

---

## Environment

Use Codex/plugin variables:

```bash
PLUGIN_ROOT="${PLUGIN_ROOT:-$(pwd)}"
PLUGIN_DATA="${PLUGIN_DATA:-$PLUGIN_ROOT/.data}"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
```

Do not use legacy plugin-root variables in new hook code.

---

## Minimal Script Shape

```bash
#!/usr/bin/env bash
set -euo pipefail

payload="$(cat)"

# Print a JSON decision only when the hook needs to block or annotate.
printf '%s\n' '{"decision":"allow"}'
```

---

## Notes

- Keep hooks fast.
- Keep hook behavior deterministic.
- Validate hook JSON and script executability after changes.
- Do not wire hooks from agent TOML.
