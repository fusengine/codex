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
model = "gpt-6-sol"
model_reasoning_effort = "medium"
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
| `model` | recommended | One of `gpt-6-sol` or `gpt-6-luna`, chosen per the model policy below; never a bare alias. |
| `model_reasoning_effort` | recommended | Per the GPT-6 catalog: `gpt-6-sol` accepts `low`, `medium`, `high`, `xhigh`, `max`, `ultra`; `gpt-6-luna` accepts `low`, `medium`, `high`, `xhigh`, `max`. Never assign `ultra` to a sub-agent (fleet uses only Sol medium/high and Luna medium — see the Model policy section). |
| `sandbox_mode` | recommended | One of `read-only`, `workspace-write`, `danger-full-access`. Use `workspace-write` for agents that edit; `read-only` for audit/explore/research/challenger agents; `danger-full-access` only when a task genuinely needs it. |
| `nickname_candidates` | optional | Array of display names; the configured nickname is identity evidence when spawning. |
| `mcp_servers` | optional | MCP servers this agent may reach; declare only servers configured for Codex. |
| `[[skills.config]]` | optional | One table per attached skill. `path` points at a repo-relative `SKILL.md`; `enabled = true`. |

There is **no** `color`, `tools`, or `hooks` frontmatter on a Codex agent. Tool access is governed by `sandbox_mode` and the runtime, not a per-agent tool list. Hooks live in the plugin's `hooks/hooks.json`, never in the agent TOML.

### Model policy

**Current, since 2026-09-23** (owner decision, verbatim, in order: "supprime
astra il coute chere" · "j'ai trouvé luna medium plus performant" · "donc on
répartie comment les model et raisonnement sur luna le high on oublie je
pense non?" · "appliquer"). The fleet moved from GPT-5.6 (Sol/Terra/Luna) to
GPT-6 (Sol/Astra/Luna). `gpt-6-astra` is excluded fleet-wide on cost. GPT-6
has no `terra` tier — the former Terra roles are redistributed between Sol
and Luna by role shape, not carried forward as a tier. The generator
classifies by the Codex agent's `name`; unknown future agents default to
`gpt-6-sol` / `medium` until explicitly classified. Every agent now sits on
`gpt-6-sol` or `gpt-6-luna` at `medium` effort, except one `gpt-6-sol` /
`high` judgment gate: `gpt-6-luna` / `high` is dropped (slow and erratic at
that effort) and `gpt-6-sol` / `low` is dropped (no better than Luna medium,
at 14x the cost). Rationale: Luna medium writes code and does mechanical
work — measured the same correctness as Sol on debugging/typed-code tasks,
roughly 30x cheaper, fastest, and does not loop at medium effort; Sol
medium judges, validates, explores, and researches — the only arm with zero
edge-case misses in testing; `challenger` and `sniper` (both Sol/medium)
review Luna's output. Prices per 1M tokens (input / cached / output,
developers.openai.com/api/docs/pricing): `gpt-6-sol` $2.00 / $0.20 /
$10.00; `gpt-6-luna` $0.10 / $0.01 / $0.50.

| Codex profile | Agents | Rationale |
|---------------|--------|-----------|
| `gpt-6-sol` / `medium` | 18 orchestration, release, exploration, research, SEO, code-validation, prompt-design, and security-audit specialists: `brainstorming`, `challenger`, `commit`, `explore-codebase`, `research-expert`, `sniper`, `changelog-watcher`, `lessons-compactor`, `prompt-engineer`, `security-expert`, `seo-cluster`, `seo-content`, `seo-expert`, `seo-geo`, `seo-local`, `seo-schema`, `seo-technical`, `solid-orchestrator` | Sol medium judges, validates, explores, and researches — the only arm with zero measured edge-case misses. `research-expert` and `explore-codebase` sit here (not on Luna) because exploration/research is a judgment-adjacent role in the new rationale, not bounded mechanical work. |
| `gpt-6-sol` / `high` | `design-expert` | Sole remaining highest-judgment gate. |
| `gpt-6-luna` / `medium` | 18 total: the 12 framework/language experts (`astro-expert`, `go-expert`, `laravel-expert`, `nextjs-expert`, `php-expert`, `react-expert`, `rust-expert`, `shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`, `tanstack-start-expert`, `typescript-expert`) + `sniper-faster`, `websearch`, `cartographer`, `commit-detector`, `seo-images`, `seo-sitemap` | Bounded, deterministic, code-writing/mechanical work with a strict, verifiable contract — Luna medium matches Sol's measured correctness on this shape at roughly 30x lower cost and does not loop. `websearch` moved here from the old volume-work tier as bounded mechanical lookup; the 12 framework experts move here because no GPT-6 Terra tier exists to hold them. |

Valid efforts per the GPT-6 catalog: `gpt-6-sol` supports `low` through
`ultra`; `gpt-6-luna` supports `low` through `max`. This fleet uses only Sol
medium (plus one Sol high) and Luna medium — never assign an effort outside
those without a new owner decision. `commit` (an irreversible git flow —
write, tags, merges) stays on Sol/medium: judgment/validation is still the
right shape for an irreversible action, independent of the old Terra
question.

The 18 Sol/medium agents are `brainstorming`, `challenger`, `commit`,
`explore-codebase`, `research-expert`, `sniper`, `changelog-watcher`,
`lessons-compactor`, `prompt-engineer`, `security-expert`, `seo-cluster`,
`seo-content`, `seo-expert`, `seo-geo`, `seo-local`, `seo-schema`,
`seo-technical`, and `solid-orchestrator`.
The 18 Luna/medium agents are `astro-expert`, `go-expert`, `laravel-expert`,
`nextjs-expert`, `php-expert`, `react-expert`, `rust-expert`,
`shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`,
`tanstack-start-expert`, `typescript-expert`, `sniper-faster`, `websearch`,
`cartographer`, `commit-detector`, `seo-images`, and `seo-sitemap`.

#### History (GPT-5.6 policy, superseded 2026-09-23)

For the full prior GPT-5.6 Sol/Terra/Luna policy (per-tier table, the owner
decision timeline, the AA index rationale, and the known Terra risk) see
[`docs/workflow/agents.md` § History (GPT-5.6 policy, superseded
2026-09-23)](../workflow/agents.md#history-gpt-56-policy-superseded-2026-09-23) —
condensed here to a pointer, not reproduced, to avoid the two copies drifting.

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
