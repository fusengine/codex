---
name: api-surface
description: Current Codex API surface used by our plugins - single source of truth for compatibility checks
when-to-use: When comparing new Codex versions against our current usage
keywords: api, hooks, agents, toml, schema, mcp, compatibility
priority: high
related: templates/migration-guide.md
---

# Current API Surface (Fusengine Codex Plugins)

This baseline records the Codex platform surface our plugins depend on. Diff each new `openai/codex` release against it; version-specific deltas are populated by the changelog scan. Do not invent version tags here — record only what is observed in a release or in this repo.

## Hook Events Used

Codex plugins declare hooks in `hooks/hooks.json`. Events currently wired across our plugins:

| Event | Plugins Using It |
|-------|-----------------|
| `SessionStart` | core-guards, fuse-rules |
| `SubagentStart` | ai-pilot, fuse-rules |
| `UserPromptSubmit` | ai-pilot, core-guards, fuse-rules |
| `PostToolUse` | ai-pilot, security-expert, changelog-watcher, core-guards |
| `SubagentStop` | ai-pilot, core-guards |
| `SessionEnd` | ai-pilot, core-guards |
| `Stop` | core-guards |

When a release adds, renames, or removes an event, flag every `hooks.json` that references the affected event.

## Hook Handler Types

| `type` | Purpose | Notes |
|--------|---------|-------|
| `command` | Shell command (default) | Supports `args: string[]` exec form, `timeout`, and async wake-up |
| `mcp_tool` | Invoke an MCP tool as a hook | Tool result becomes the hook response |
| `prompt` | Prompt-template hook | Bounded timeout |
| `agent` | Full-agent hook | Bounded timeout |

## Hook I/O Notes (verified in-session)

- `hide_spawn_agent_metadata` defaults to `true`; `agent_type` is only exposed when it is `false`.
- The namespaced spawn tool name is the concatenation **without** a separator: `{ns}spawn_agent` (`flat_tool_name`). Any spawn matcher must cover both `spawn_agent` and `endsWith("spawn_agent")`.
- A stateful gate must carry a freshness window; cumulative `modifiedFiles` without one yields permanent false positives under Codex.
- The per-model 400 backend error is the known `openai/codex#26753` bug, not a side effect of `hide_spawn_agent_metadata`.

## Agent TOML Fields

Codex agents are `.toml` files (`agents/<name>.toml`). Valid fields:

| Field | Required | Values |
|-------|----------|--------|
| `name` | Yes | string |
| `description` | Yes | string |
| `developer_instructions` | Yes | string (agent body) |
| `model` | No | `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna` |
| `model_reasoning_effort` | No | `minimal`, `low`, `medium`, `high`, `xhigh` |
| `sandbox_mode` | No | `read-only`, `workspace-write`, `danger-full-access` |
| `nickname_candidates` | No | array of strings |
| `mcp_servers` | No | MCP server declarations |
| `[[skills.config]]` | No | one table per skill: `path`, `enabled` |

No other fields are valid — a release adding a field is `[NEW]`; renaming/removing one is `[BREAKING]`.

## Skill SKILL.md Frontmatter

Required: `name`, `description`. Nothing else is supported in Codex skill frontmatter.

## Plugin Manifest (.codex-plugin/plugin.json)

Required: `name`, `version`, `description`, `author`, `license`. Optional: `homepage`, `repository`, `keywords`, `category`. Arrays: `commands`, `agents`, `skills`.

## MCP Declaration (.mcp.json)

Per-plugin MCP server declarations consumed by Codex. Changes to the schema affect every plugin shipping a `.mcp.json`.

## Plugin / Environment Variables

| Variable | Description |
|----------|-------------|
| `${PLUGIN_ROOT}` | Plugin install directory |
| `${CODEX_HOME}` | Codex home (defaults to `~/.codex`); state lives under `${CODEX_HOME}/fusengine/state/`, never in `agents/` or `prompts/` |

Never place fusengine state files inside a directory Codex scans for its own artifacts (`~/.codex/agents/`, `~/.codex/prompts/`).

## Reference Frontmatter

Required: `name`, `description`. Optional: `when-to-use`, `keywords`, `priority`, `related`.

## CLI Flags Used in Scripts

| Flag/Command | Scripts Using It |
|-------------|-----------------|
| `jq` | All hook scripts |
| `grep -rn` | security-scan scripts |
| `gh api` | changelog fetch |
| `wc -l` | SOLID-compliance checks |

## Last Updated

Date: {populate on each scan}
Codex Version: {populate from the latest observed openai/codex release}
