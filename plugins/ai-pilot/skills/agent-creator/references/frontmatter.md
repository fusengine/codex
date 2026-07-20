---
name: frontmatter
description: Agent TOML field configuration
---

# Agent TOML Fields

## Overview

A Codex agent is a `.toml` file. Its top-level fields define the agent's behavior and capabilities; the body lives in `developer_instructions`.

---

## Complete Example

```toml
name = "nextjs-expert"
description = "Expert Next.js 16 with App Router, Prisma 7, Better Auth. Use when building Next.js apps."
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
developer_instructions = '''
# Next.js Expert
...
'''

[[skills.config]]
path = "plugins/nextjs-expert/skills/solid-nextjs/SKILL.md"
enabled = true

[[skills.config]]
path = "plugins/nextjs-expert/skills/nextjs-16/SKILL.md"
enabled = true
```

> Pre/Post-tool validation hooks do NOT belong in the agent `.toml` — they live in the plugin's `hooks/hooks.json`. See [hooks.md](hooks.md).

---

## Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (kebab-case), matches filename |
| `description` | Yes | One-line for agent detection ("Use when… / Do NOT use for…") |
| `model` | Yes | `gpt-5.6-sol` or `gpt-5.6-terra` |
| `model_reasoning_effort` | Yes | `high` |
| `sandbox_mode` | Yes | `workspace-write` or `read-only` |
| `nickname_candidates` | No | Display nicknames (array) |
| `developer_instructions` | Yes | Full agent body as a `'''…'''` multiline string |
| `[[skills.config]]` | No | One table per attached skill (`path` + `enabled`) |

There is NO `tools:` field (Codex does not map tools 1:1 — describe an essential capability in prose) and NO `color:` field.

---

## Model Selection

| Model | When to Use |
|-------|-------------|
| `gpt-5.6-sol` | Heavy reasoning, architecture, orchestrator/verifier roles (sniper, challenger, research-expert, brainstorming, security, deep-analysis) |
| `gpt-5.6-terra` | Domain-expert / execution / read-only roles (framework experts, explore-codebase, websearch) |

`model_reasoning_effort` is always `high`. Valid effort values: `minimal`, `low`, `medium`, `high`, `xhigh`. Always use the explicit `-sol`/`-terra` IDs (never the bare `gpt-5.6` alias).

---

## Sandbox Mode

| Value | When to Use |
|-------|-------------|
| `workspace-write` | Agents that edit/create files (domain experts, sniper, commit) |
| `read-only` | Agents that never write (explore-codebase, research-expert, challenger, websearch) |

---

## Capabilities via MCP

MCP servers declared in the plugin's `.mcp.json` are available to the agent. Reference their tools directly in the body:

| MCP Tool | Purpose |
|----------|---------|
| `mcp__context7__*` | Documentation lookup |
| `mcp__shadcn__*` | UI component registry |
| `mcp__gemini-design__*` | AI frontend generation |
| `mcp__exa__*` | Web search |
| `mcp__fuse-browser__*` | Web fetch/crawl/SERP, browser session |

---

## Skills Attachment

```toml
[[skills.config]]
path = "plugins/<plugin>/skills/solid-<stack>/SKILL.md"
enabled = true
```

**Always attach:**
- `solid-[stack]` - SOLID rules for the stack
- Main framework skill
- Related technology skills

---

## Description Best Practices

| Good | Bad |
|------|-----|
| "Expert Next.js 16 with App Router. Use when building Next.js apps." | "Next.js developer" |
| "Expert Laravel 12 with Eloquent, Livewire. Use when building Laravel apps." | "PHP expert" |

**Pattern**: "Expert [tech] with [features]. Use when [trigger]."

→ See [templates/agent-template.md](templates/agent-template.md) for complete example
