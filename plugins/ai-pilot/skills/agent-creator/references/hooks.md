---
name: hooks
description: Pre/Post tool validation hooks for plugins
---

# Plugin Hooks

## Overview

Hooks run scripts before or after tool execution to enforce rules. In Codex they live in the plugin's `hooks/hooks.json` (plugin level) — NOT in the agent `.toml`.

---

## Hook Types

| Type | When | Purpose |
|------|------|---------|
| `PreToolUse` | Before tool runs | Validate, block if invalid |
| `PostToolUse` | After tool runs | Track, analyze, notify |

---

## hooks.json Configuration

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash ${PLUGIN_ROOT}/scripts/validate-solid.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          { "type": "command", "command": "bash ${PLUGIN_ROOT}/scripts/track-reads.sh" }
        ]
      }
    ]
  }
}
```

---

## Matcher Patterns

| Pattern | Matches |
|---------|---------|
| `Write` | Write tool only |
| `Write\|Edit` | Write OR Edit |
| `Read` | Read tool only |
| `Bash` | Bash tool only |

---

## Common Hooks

### SOLID Validation (PreToolUse)

```json
{
  "matcher": "Write|Edit",
  "hooks": [
    { "type": "command", "command": "bash ${PLUGIN_ROOT}/scripts/validate-solid.sh" }
  ]
}
```

**Purpose**: Check file size, interface location before writing.

### Skill Tracking (PostToolUse)

```json
{
  "matcher": "Read",
  "hooks": [
    { "type": "command", "command": "bash ${PLUGIN_ROOT}/scripts/track-skill-read.sh" }
  ]
}
```

**Purpose**: Track which skills are being consulted.

---

## Environment Variables

| Variable | Value |
|----------|-------|
| `$PLUGIN_ROOT` | Plugin directory path |
| `$TOOL_NAME` | Name of tool being used |
| `$FILE_PATH` | Target file path (if applicable) |

---

## Script Requirements

| Requirement | Description |
|-------------|-------------|
| Executable | `chmod +x scripts/*.sh` |
| Exit codes | 0 = success, non-zero = block |
| Location | `plugins/<name>/scripts/` |

---

## Best Practices

| DO | DON'T |
|----|-------|
| Use `$PLUGIN_ROOT` | Hard-code paths |
| Keep scripts fast | Long-running validations |
| Exit 0 on success | Swallow errors silently |
| Log issues clearly | Cryptic error messages |
| Wire hooks in hooks.json | Put hooks in the agent .toml |

→ See [templates/hook-scripts.md](templates/hook-scripts.md) for script examples
