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
| `model` | recommended | One of `gpt-5.6-sol`, `gpt-5.6-terra` or `gpt-5.6-luna`, chosen per the model policy below; use an explicit tier id, never the bare `gpt-5.6` alias. |
| `model_reasoning_effort` | recommended | One of `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`. |
| `sandbox_mode` | recommended | One of `read-only`, `workspace-write`, `danger-full-access`. Use `workspace-write` for agents that edit; `read-only` for audit/explore/research/challenger agents; `danger-full-access` only when a task genuinely needs it. |
| `nickname_candidates` | optional | Array of display names; the configured nickname is identity evidence when spawning. |
| `mcp_servers` | optional | MCP servers this agent may reach; declare only servers configured for Codex. |
| `[[skills.config]]` | optional | One table per attached skill. `path` points at a repo-relative `SKILL.md`; `enabled = true`. |

There is **no** `color`, `tools`, or `hooks` frontmatter on a Codex agent. Tool access is governed by `sandbox_mode` and the runtime, not a per-agent tool list. Hooks live in the plugin's `hooks/hooks.json`, never in the agent TOML.

### Model policy

The generator classifies by the Codex agent's `name`, because a Claude source
model is too coarse to preserve the shipped role policy. Unknown future agents
default to `gpt-5.6-sol` / `medium` until explicitly classified. Revised
2026-09-02, following a 15-run `codex exec` 0.152.1 benchmark (see
`docs/workflow/agents.md` § Benchmark 2026-09-02): the 12 framework/language
experts use `gpt-5.6-terra` / `medium`, the fastest and cheapest tier at
equal measured quality on bounded, briefed executor work; every other role
keeps its prior tier.

| Codex profile | Agents | Rationale |
|---------------|--------|-----------|
| `gpt-5.6-terra` / `medium` | 12 framework/language experts (`astro-expert`, `go-expert`, `laravel-expert`, `nextjs-expert`, `php-expert`, `react-expert`, `rust-expert`, `shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`, `tanstack-start-expert`, `typescript-expert`) | Executor tier for bounded, briefed coding work: a 15-run `codex exec` 0.152.1 benchmark found Terra medium equal in measured quality to Sol medium (every run passed every hidden test on both tiers), 1.7× faster and at roughly half the token cost. |
| `gpt-5.6-sol` / `medium` | 16 explorer, research, orchestration, release, SEO, and code-validation specialists (incl. `sniper`) | Balanced daily development execution; Artificial Analysis Sol index (July 2026, artificialanalysis.ai/models/gpt-5-6-luna and the Sol launch article) puts medium 1 point below high (56 vs 57) — the only gap within the owner's 1-point non-regression threshold. `sniper` moved to Sol/medium on 2026-09-02 (owner decision): it validates code with tooling and tests, where the benchmark showed medium equal to high; the challenger keeps high for adversarial, fresh-context review. |
| `gpt-5.6-sol` / `high` | `challenger`, `security-expert`, `prompt-engineer` | One-shot-correctness gates (adversarial review, security validation, prompt quality); unchanged. |
| `gpt-5.6-sol` / `xhigh` | `design-expert` | Highest visual/product-direction judgment (index 59); a move to `high` (57) would be a 2-point drop, over the 1-point threshold, so it is NOT reclassified. |
| `gpt-5.6-luna` / `max` | `sniper-faster`, `commit-detector`, `cartographer`, `seo-images`, `seo-sitemap` | Bounded, deterministic work with a strict contract and a verifiable output; Luna has no `ultra` effort and is weak on long multi-step instruction-following, so it is reserved for this narrow shape. Luna max scores 52 on the same index — `seo-technical`, `seo-schema`, and `websearch` fit the task shape but a Sol medium (56) → Luna max (52) move is a 4-point drop, over threshold, so they stay on Sol/medium instead. |

Sol max is not used by any shipped agent and is not asserted here
(published figures diverge between AA pages). Terra is the executor tier as
of 2026-09-02: the benchmark above found it equal in quality to Sol medium
on bounded, briefed coding work, 1.7× faster and at roughly half the cost.
`commit` (an irreversible git flow — write, tags, merges) stays on
Sol/medium rather than Terra because it is not the bounded-executor shape
the benchmark covered. Known risk, kept: openai/codex#32389 is still open
in 0.152 ("GPT-5.6 Terra intermittently returns an empty successful final
response after tool use, prematurely ending agent loops", reported at
medium effort) — not reproduced in 12 Terra runs across this benchmark;
mitigated by doctrine (the coordinator checks every deliverable on disk
against the PRD, and challenger + sniper gate acceptance), so the failure
mode is a retry, never a silent bad merge. The earlier field-report
characterization of Terra as "worst of both worlds" (quota burn without a
matching quality gain) is kept for the record but was not reproduced by
this benchmark. `research-expert`, `brainstorming`, and `solid-orchestrator`
moved from Sol/high to Sol/medium (57→56, -1, within threshold).
`lessons-compactor` moved from Luna/max to Sol/medium (52→56, +4 — a strict
quality increase, not a regression risk) for a role needing long-horizon
dedup/merge judgment rather than a bounded mechanical task.

The 16 Sol/medium agents are `explore-codebase`, `research-expert`,
`brainstorming`, `solid-orchestrator`, `commit`, `changelog-watcher`,
`lessons-compactor`, `seo-expert`, `seo-content`, `seo-geo`, `seo-local`,
`seo-cluster`, `seo-technical`, `seo-schema`, `websearch`, and `sniper`.
The 12 Terra/medium agents are `astro-expert`, `go-expert`, `laravel-expert`,
`nextjs-expert`, `php-expert`, `react-expert`, `rust-expert`,
`shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`,
`tanstack-start-expert`, and `typescript-expert`.

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
