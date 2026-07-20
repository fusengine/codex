# Hooks System

Automatic enforcement of APEX, SOLID, safety, and notification behavior through
Codex plugin hooks.

## Overview

The hooks system helps agents:
1. Consult relevant skills before risky changes.
2. Follow APEX where it is useful.
3. Validate SOLID/DRY rules.
4. Surface blocking feedback through Codex hook output.

## Architecture

```
~/.codex/config.toml
       |
       v
plugins/*/hooks/hooks.json
       |
       v
@fusengine/harness hook codex [scope]
```

Every configured command handler uses a canonical Harness route. There is no
legacy-command exception path: an unregistered plugin/event/matcher tuple is
rejected by validation and skipped by generation.

### Harness 0.1.79 Runtime Limits

Harness-only wiring guarantees that the handler enters Harness; it does not
claim complete Codex behavior parity in the installed 0.1.79 runtime. Inspection
of that published bundle shows these remaining compatibility limits:

- design-agent lifecycle handling runs only for `id === "claude-code"`.
- core session, rules, cartography, and failure paths still contain Claude roots
  such as `CLAUDE_PLUGIN_ROOT`, `.claude`, and `CLAUDE.md`.
- lifecycle dispatch includes Claude-only names such as `TaskCompleted`,
  `PostToolUseFailure`, and `SessionEnd`; Codex does not emit those events.

These are Harness runtime gaps, not reasons to wire direct plugin scripts.

Plugin hooks require:

```toml
[features]
hooks = true
```

## Installation

### macOS / Linux

```bash
~/.codex/.tmp/marketplaces/fusengine-codex/setup.sh
```

### Windows

```powershell
~/.codex/.tmp/marketplaces/fusengine-codex/setup.ps1
```

The installer writes Codex configuration under `${CODEX_HOME:-~/.codex}` and
caches local plugins under:

```
~/.codex/plugins/cache/fusengine-codex/<plugin>/<version>/
```

## Stable Hook Events

Register only stable Codex plugin hook events:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `SessionStart` | Session starts | Load context and cleanup state |
| `UserPromptSubmit` | User sends a message | Detect project type and inject guidance |
| `PreToolUse` | Before tool execution | Block unsafe or invalid actions |
| `PostToolUse` | After tool execution | Validate results and track changes |
| `PermissionRequest` | Permission prompt shown | Notify user |
| `Stop` | Turn finishes | Cleanup and completion notification |

Do not register `PreCompact` for plugin hooks until Codex stabilizes it.

## Adding Hooks To A Plugin

1. Create the hook directory:

```bash
mkdir -p plugins/my-plugin/hooks
```

2. Create `hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "apply_patch",
        "hooks": [
          {
            "type": "command",
            "command": "bun \"${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs\" hook codex core"
          }
        ]
      }
    ]
  }
}
```

Use only the route registered for the exact plugin/event/matcher tuple. Unknown
scopes are unsafe because the CLI can fall back silently. Do not wire a new
direct script; port its behavior to Harness and add parity tests first.

## Harness Input

Hooks receive JSON input through stdin:

```json
{
  "tool_name": "apply_patch",
  "tool_input": {
    "file_path": "/path/to/file.ts"
  }
}
```

## Harness Output

Allow:

```bash
exit 0
```

Harness emits native structured Codex output, including `hookSpecificOutput`
for permission decisions. Do not teach legacy stderr/`exit 2` protocols.

## Legacy Script Removal

Plugin `scripts/` directories may still contain source or migration artifacts,
but hook configuration must not invoke them. Remove an artifact only after no
source, bundle, generator, test, or documentation references it.

## Troubleshooting

Check feature flags:

```bash
codex features list | rg '^hooks'
```

Check installed cache:

```bash
find ~/.codex/plugins/cache/fusengine-codex -maxdepth 3 -name hooks.json
```

Run validation from the source repository:

```bash
bun run validate
```

This includes the exhaustive Harness route gate.
