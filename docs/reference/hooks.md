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
plugins/*/scripts/*.ts|*.sh|*.py
```

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

1. Create the hook directories:

```bash
mkdir -p plugins/my-plugin/hooks plugins/my-plugin/scripts
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
            "command": "bun ${PLUGIN_ROOT}/scripts/my-check.ts"
          }
        ]
      }
    ]
  }
}
```

3. Create the script under `scripts/`.

The plugin runtime provides `PLUGIN_ROOT` and `PLUGIN_DATA`. Legacy Claude env
vars are allowed only in migration compatibility code.

## Script Input

Hooks receive JSON input through stdin:

```json
{
  "tool_name": "apply_patch",
  "tool_input": {
    "file_path": "/path/to/file.ts"
  }
}
```

## Script Output

Allow:

```bash
exit 0
```

Block:

```bash
echo "Blocking message" >&2
exit 2
```

Add context:

```bash
echo '{"additionalContext": "Context for the model"}'
exit 0
```

Prefer structured helper output when available so Codex receives both
`systemMessage` and log entries.

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
