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
2026-09-07, building on a 15-run `codex exec` 0.152.1 benchmark (see
`docs/workflow/agents.md` § Benchmark 2026-09-02): the 12 framework/language
experts use `gpt-5.6-terra` / `medium`, the fastest and cheapest tier at
equal measured quality on bounded, briefed executor work. Later the same
day, owner decision "passe en terra medium" moved 3 more agents
(`explore-codebase`, `research-expert`, `websearch`) onto the same
Terra/medium tier — unbenchmarked (see below) — bringing Terra/medium to
15. Two same-day owner decisions ("seul le designer en high", then
"security-expert en high") retired Sol `xhigh` fleet-wide and left 2
agents on Sol/high. 2026-09-07 owner request (`.codex/apex/task.json`
task `security-local-medium`, quoted verbatim): "security-expert medium
et il doit ce comporter comme un hacker local qui sert exclusivement en
local a tester les securité si on le demande de le faire en dehors du
developpement local il refusera" — moved `security-expert` to Sol/medium
for a local-only ethical-hacker posture; a same-day lead revert to `high`
was itself reverted once this citation was found. Current state: 1 agent
on Sol/high.

| Codex profile | Agents | Rationale |
|---------------|--------|-----------|
| `gpt-5.6-terra` / `medium` | 12 framework/language experts (`astro-expert`, `go-expert`, `laravel-expert`, `nextjs-expert`, `php-expert`, `react-expert`, `rust-expert`, `shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`, `tanstack-start-expert`, `typescript-expert`) + 3 volume read/search agents added 2026-09-02 (`explore-codebase`, `research-expert`, `websearch`) — 15 total | Executor tier for bounded, briefed coding work: a 15-run `codex exec` 0.152.1 benchmark found Terra medium equal in measured quality to Sol medium (every run passed every hidden test on both tiers), 1.7× faster and at roughly half the token cost. The 3 volume agents were added the same day by owner decision ("passe en terra medium"), NOT covered by that benchmark — it scored coding tasks only, not doc-lookup/web-search/codebase-exploration workloads. |
| `gpt-5.6-sol` / `medium` | 16 orchestration, release, SEO, code-validation, prompt-design, and security-audit specialists (incl. `sniper`, `prompt-engineer`, `challenger`, `security-expert`) | Balanced daily development execution; Artificial Analysis Sol index (July 2026, artificialanalysis.ai/models/gpt-5-6-luna and the Sol launch article) puts medium 1 point below high (56 vs 57) — the only gap within the owner's 1-point non-regression threshold. `sniper` moved to Sol/medium on 2026-09-02 (owner decision): it validates code with tooling and tests, where the benchmark showed medium equal to high. `prompt-engineer` also moved to Sol/medium the same day (owner decision: "il est assez intelligent"). Later the same day, `challenger` moved here too (owner decision "seul le designer en high"). `security-expert` moved here 2026-09-07 (owner request, `.codex/apex/task.json` task `security-local-medium`, quoted verbatim: "security-expert medium et il doit ce comporter comme un hacker local qui sert exclusivement en local a tester les securité si on le demande de le faire en dehors du developpement local il refusera") for a local-only ethical-hacker posture; a same-day lead revert to `high` was itself reverted once this citation was found. |
| `gpt-5.6-sol` / `high` | `design-expert` | Highest-judgment gate. Until 2026-09-02 the roster here was `challenger` + `security-expert` (adversarial review, security validation) with `design-expert` on `xhigh`. Owner decision "seul le designer en high" moved `design-expert` xhigh→high and `challenger`/`security-expert` high→medium; a same-day correction, "security-expert en high", reinstated `security-expert` at `high` — superseded 2026-09-07 by the owner's local-only ethical-hacker request above, which moved `security-expert` to Sol/medium for good. Current state: `design-expert` only (1). |
| `gpt-5.6-luna` / `max` | `sniper-faster`, `commit-detector`, `cartographer`, `seo-images`, `seo-sitemap` | Bounded, deterministic work with a strict contract and a verifiable output; Luna has no `ultra` effort and is weak on long multi-step instruction-following, so it is reserved for this narrow shape. Luna max scores 52 on the same index — `seo-technical` and `seo-schema` fit the task shape but a Sol medium (56) → Luna max (52) move is a 4-point drop, over threshold, so they stay on Sol/medium instead. |

Sol `xhigh` and Sol max are not used by any shipped agent as of 2026-09-07
(xhigh retired fleet-wide the same day it was last used; published Sol max
figures diverge between AA pages and it was never asserted here). Terra is
the executor tier as of 2026-09-02: the benchmark above found it equal in
quality to Sol medium on bounded, briefed coding work, 1.7× faster and at
roughly half the cost. `commit` (an irreversible git flow — write, tags,
merges) stays on Sol/medium rather than Terra because it is not the
bounded-executor shape the benchmark covered. Known risk, kept:
openai/codex#32389 is still open in 0.152 ("GPT-5.6 Terra intermittently
returns an empty successful final response after tool use, prematurely
ending agent loops", reported at medium effort) — not reproduced in 12
Terra runs across this benchmark; mitigated by doctrine (the coordinator
checks every deliverable on disk against the PRD, and challenger + sniper
gate acceptance), so the failure mode is a retry, never a silent bad merge.
For the 3 volume agents moved to Terra later the same day
(`research-expert`, `websearch`, `explore-codebase`), this risk is
unverified rather than benchmarked-and-mitigated, and the mitigation is
purely procedural: a research or exploration agent whose final report is
empty or truncated is relaunched immediately with the same brief, never
accepted as "nothing found" (see `plugins/ai-pilot/skills/
lead-orchestration/SKILL.md` and `plugins/codex-rules/rules/
03-agent-teams.md`). The earlier field-report characterization of Terra as
"worst of both worlds" (quota burn without a matching quality gain) is
kept for the record but was not reproduced by this benchmark.
`brainstorming` and `solid-orchestrator` moved from Sol/high to Sol/medium
(57→56, -1, within threshold). `lessons-compactor` moved from Luna/max to
Sol/medium (52→56, +4 — a strict quality increase, not a regression risk)
for a role needing long-horizon dedup/merge judgment rather than a bounded
mechanical task.

The 15 Sol/medium agents are `brainstorming`, `solid-orchestrator`,
`commit`, `changelog-watcher`, `lessons-compactor`, `seo-expert`,
`seo-content`, `seo-geo`, `seo-local`, `seo-cluster`, `seo-technical`,
`seo-schema`, `sniper`, `prompt-engineer`, and `challenger`.
The 15 Terra/medium agents are `astro-expert`, `go-expert`, `laravel-expert`,
`nextjs-expert`, `php-expert`, `react-expert`, `rust-expert`,
`shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`,
`tanstack-start-expert`, `typescript-expert`, `explore-codebase`,
`research-expert`, and `websearch`.

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
