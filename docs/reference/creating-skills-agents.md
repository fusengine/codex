# Creating Skills & Agents (Codex)

Guide for authoring Codex agents (`.codex/agents/*.toml`) and skills (`SKILL.md` folders) in this marketplace.

## Overview

| Artifact | Source location (repo) | Runtime location | Format |
|----------|------------------------|------------------|--------|
| Agent | `plugins/<plugin>/agents/<name>.toml` | `~/.codex/agents/<name>.toml` | TOML |
| Skill | `plugins/<plugin>/skills/<name>/SKILL.md` | resolved by path from the agent's `[[skills.config]]` | Markdown + frontmatter |

Agents are **not** discovered automatically from the repo. The setup/update installer copies each plugin's `agents/*.toml` into `~/.codex/agents/`, where the Codex binary scans them. Never drop non-agent files into `~/.codex/agents/` — Codex treats every file there as an agent definition.

---

## Creating an Agent

### File format (`.codex/agents/<name>.toml`)

```toml
name = "sniper"
description = "Elite code error detection and correction. Use after ANY code modification. Do NOT use for: new features, read-only analysis."
model = "gpt-5.6-sol"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
nickname_candidates = ["Sniper", "Code Sniper", "Sniper Agent"]
developer_instructions = '''
# Sniper Agent

<full instruction body — same substance as the source, Codex idioms>
'''

[[skills.config]]
path = "plugins/ai-pilot/skills/code-quality/SKILL.md"
enabled = true
```

### Required keys

| Key | Required | Notes |
|-----|----------|-------|
| `name` | yes | kebab-case, unique across the ecosystem, referenced by `spawn_agent`. |
| `description` | yes | Keep the `Use when… / Do NOT use for…` routing pattern — it drives agent selection. |
| `developer_instructions` | yes | Triple-quoted (`'''…'''`) string holding the full agent brief. No truncation of source substance. |
| `model` | recommended | One of `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`. Use explicit `-sol`/`-terra` ids, never the bare `gpt-5.6` alias. |
| `model_reasoning_effort` | recommended | One of `minimal`, `low`, `medium`, `high`, `xhigh`. |
| `sandbox_mode` | recommended | One of `read-only`, `workspace-write`, `danger-full-access`. Use `workspace-write` for agents that edit; `read-only` for audit/explore/research/challenger agents; `danger-full-access` only when a task genuinely needs it. |
| `nickname_candidates` | optional | Array of display names; the configured nickname is identity evidence when spawning. |
| `mcp_servers` | optional | MCP servers this agent may reach; declare only servers configured for Codex. |
| `[[skills.config]]` | optional | One table per attached skill. `path` points at a repo-relative `SKILL.md`; `enabled = true`. |

There is **no** `color`, `tools`, or `hooks` frontmatter on a Codex agent. Tool access is governed by `sandbox_mode` and the runtime, not a per-agent tool list. Hooks live in the plugin's `hooks/hooks.json`, never in the agent TOML.

### Model mapping (from Claude source agents)

| Claude `model:` | Codex `model` / `model_reasoning_effort` | Applies to |
|-----------------|------------------------------------------|------------|
| `opus` | `gpt-5.6-sol` / `high` | complex reasoning, architecture |
| `sonnet` (orchestrator / heavy reasoning / critical verifier) | `gpt-5.6-sol` / `high` | sniper, challenger, research-expert, brainstorming, `*-orchestrator`, security-expert, apex, deep-analysis |
| `sonnet` (domain expert / execution sub-agent) | `gpt-5.6-terra` / `high` | laravel-expert, react-expert, seo-technical, go-expert, tailwindcss, … |
| `haiku` (fast/simple) | `gpt-5.6-terra` / `high` | quick sub-agents |

Reasoning effort is `high` across the board in this port; `luna` is not used.

---

## Creating a Skill

### Folder structure

```
skills/<skill-name>/
├── SKILL.md          # entry point (frontmatter + body)
├── references/       # conceptual docs (WHY / WHEN)
├── scripts/          # executable helpers
└── templates/        # complete, working code samples
```

### SKILL.md frontmatter — `name` + `description` ONLY

Codex supports exactly two frontmatter keys. Everything else Claude used (`versions`, `user-invocable`, `references`, `related-skills`, `argument-hint`, `when-to-use`, `keywords`, `priority`, `model`, `color`) is dropped.

```markdown
---
name: code-quality
description: "Code quality validation for post-edit checks. Use when: after any code modification. Do NOT use for: new features, read-only analysis."
---

# Code Quality Skill

<full body — Codex idioms>
```

If version info from a dropped `versions:` block matters, re-inject it as prose in the body (e.g. "Targets Laravel 13 / PHP 8.3"). `references/**`, `scripts/**`, and `templates/**` are copied faithfully; only rewrite internal paths (`plugins/<x>/skills/…`, `.claude/` → `.codex/`) and any Claude-specific mechanisms cited.

---

## Semantic adaptation — bans (rewrite, never leave in place)

Apply across every `developer_instructions`, skill body, and reference file:

| Claude-ism | Codex replacement |
|------------|-------------------|
| `subagent_type="fuse-x:agent"`, `Agent(subagent_type=…)`, `Task` tool | `spawn_agent` targeting an agent by its bare `name` (`~/.codex/agents/<name>.toml`) |
| `TeamCreate`, "spawn 3 agents in parallel" | Codex multi-agent phrasing (`spawn_agent`, threads) — keep the intent (parallel analysis) |
| `Skill` tool, `skills:` frontmatter, `$plugin:skill` | Codex skill invocation: `$skill-name` or `/skills` |
| marketplace refs `fuse-<x>:<y>` (e.g. `fuse-ai-pilot:sniper`) | bare Codex name (`sniper`, `research-expert`, …) |
| `CLAUDE.md`, `.claude/`, `${CLAUDE_PLUGIN_ROOT}` | `AGENTS.md`, `.codex/`, `${CODEX_HOME}` / `${PLUGIN_ROOT}` per context |
| "Claude Code" (the product) | "Codex" |
| named `Read`/`Glob`/`Grep` tools | generic ("read/search files") or the Codex idiom |
| `mcp__<server>__*` tools | keep **only** if the MCP server is declared in Codex (`.mcp.json`); otherwise describe in prose |

Do **not** over-adapt: keep all domain substance (sniper's 7-phase workflow, SOLID, APEX, exit contract, framework specifics). Translate the mechanisms, never the content.

---

## Validation before shipping

- `ls plugins/<p>/agents/*.toml` matches the source agent count and names.
- Each `SKILL.md` parses with only `name` + `description` frontmatter.
- Each `.toml` parses; `model` is in the valid set; every `[[skills.config]]` `path` resolves on disk.
- `grep -rEi 'subagent_type|TeamCreate|CLAUDE\.md|\.claude/|fuse-[a-z]+:' plugins/<p>/` returns nothing (bar documented, justified cases).
</content>
</invoke>
