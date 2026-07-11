---
name: hooks
description: Codex plugin hook configuration notes
when-to-use: Understanding where hook wiring belongs for Codex plugins
keywords: hooks, codex, plugin, lifecycle, scripts
priority: medium
related: frontmatter.md, architecture.md
---

# Codex Plugin Hooks

## Overview

Hooks are plugin configuration, not agent TOML. This skill may describe hook patterns, but do not modify hook files unless the user explicitly asks for hook changes.

---

## Location

| Item | Location |
|------|----------|
| Hook config | `plugins/<plugin>/hooks/hooks.json` |
| Plugin manifest pointer | `.codex-plugin/plugin.json` field `hooks` |
| Runtime | `@fusengine/harness` canonical Codex route |

---

## Environment

| Variable | Meaning |
|----------|---------|
| `PLUGIN_ROOT` | Plugin directory path |
| `PLUGIN_DATA` | Plugin data directory |
| `CODEX_HOME` | Codex home directory |

Legacy environment variables are allowed only in migration compatibility code.

---

## Agent Rule

Agent TOML files should reference hook behavior only as prose. They must not embed legacy hook frontmatter.

---

## Best Practices

| DO | DON'T |
|----|-------|
| Keep hooks in `hooks/hooks.json` | Put hooks in agent TOML |
| Use the registered Harness route | Wire a new direct plugin script |
| Keep hook scripts fast | Run broad validations on every read |
| Validate hook config separately | Assume hook wiring works |

The repository gate scans every plugin hook. Every command must match the
canonical Harness command for its exact plugin/event/matcher route. There is no
direct-command exception path. A missing runtime behavior belongs in Harness;
do not bypass it with a plugin script.
