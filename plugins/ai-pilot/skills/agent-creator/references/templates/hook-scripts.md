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
| Runtime | `@fusengine/harness` canonical Codex route |
| Manifest pointer | `.codex-plugin/plugin.json` field `hooks` |

---

## Canonical Command

```json
{
  "type": "command",
  "command": "bun \"${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs\" hook codex core"
}
```

Select the scope from the exact plugin/event/matcher route matrix; never copy
`core` without verifying that route. Harness owns payload normalization and
native structured Codex output.

---

## Notes

- Keep hook behavior deterministic and test it in Harness.
- Validate the full hook route matrix after changes.
- Do not wire hooks from agent TOML.
- Do not create a direct plugin script or teach stderr/`exit 2` blocking.
- Do not add an exception when a Harness route or behavior is missing.
