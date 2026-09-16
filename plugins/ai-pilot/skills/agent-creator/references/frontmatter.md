---
name: frontmatter
description: Codex agent TOML top-level keys
when-to-use: Configuring agent identity, model, sandbox, skills, nicknames
keywords: toml, frontmatter, model, sandbox_mode, nickname_candidates, skills.config
priority: high
related: hooks.md, architecture.md
---

# Agent Frontmatter (TOML)

## Overview

A Codex agent is one TOML file at `plugins/<plugin>/agents/<name>.toml`. There
is no YAML frontmatter block inside a Markdown file — the whole file IS the
configuration, and the agent's full prompt lives in the `developer_instructions`
string.

There is **no** `color`, `tools`, or `hooks` key on a Codex agent. Tool access
is governed by `sandbox_mode` and the runtime, not a per-agent tool list.
Hooks live in the plugin's `hooks/hooks.json`, never in the agent TOML — see
[hooks.md](hooks.md).

---

## Complete Example

```toml
name = "sniper"
description = "Elite code error detection and correction. Use after ANY code modification. Do NOT use for: new features, read-only analysis."
model = "gpt-5.6-sol"
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"
nickname_candidates = ["Sniper", "Code Sniper", "Sniper Agent"]
developer_instructions = '''
# Sniper Agent

Full instruction body — same substance as the source, Codex idioms.
'''

[[skills.config]]
path = "plugins/ai-pilot/skills/code-quality/SKILL.md"
enabled = true
```

Real reference: `plugins/typescript-expert/agents/typescript-expert.toml`.

---

## Field Reference

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | kebab-case, unique across the ecosystem, referenced by `spawn_agent`. Blank/missing drops the whole file at Codex startup (one-line warning only — the agent silently never becomes spawnable). |
| `description` | Yes | Keep the "Use when… / Do NOT use for…" routing pattern — it drives agent selection. |
| `developer_instructions` | Yes | Triple-quoted (`'''…'''`) string holding the full agent brief. No truncation of source substance. |
| `model` | Recommended | Explicit tier id only: `gpt-5.6-sol`, `gpt-5.6-terra` or `gpt-5.6-luna`, chosen per Model Selection below. Never the bare `gpt-5.6` alias. |
| `model_reasoning_effort` | Recommended | One of `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. |
| `sandbox_mode` | Recommended | One of `read-only`, `workspace-write`, `danger-full-access`. See `sandbox_mode` Guidance below. |
| `nickname_candidates` | Optional | Array of display names, identity evidence when spawning. See rules below. |
| `mcp_servers` | Optional | MCP servers this agent may reach; declare only servers configured for Codex. |
| `[[skills.config]]` | Optional | One table per attached skill: `path` (repo-relative `SKILL.md`) + `enabled = true`. |

No other top-level key is meaningful to the agent loader. Unknown keys are not
fatal (they are silently absorbed by the flattened config), but do not rely on
that — never add `color`, a `tools` list, or a `hooks` table here.

---

## Model Selection

| `model` / effort | When to use |
|-------------------|-------------|
| `gpt-5.6-terra` / `medium` | The 12 framework/stack experts (astro, go, laravel, nextjs, php, react, rust, shadcn-ui, swift, tailwindcss, tanstack-start, typescript) + 3 volume read/search agents added 2026-09-02 (`explore-codebase`, `research-expert`, `websearch`) — 15 total |
| `gpt-5.6-sol` / `medium` | 16 orchestration/release/validation/prompt-design/security-audit agents (brainstorming, solid-orchestrator, commit, changelog-watcher, lessons-compactor, seo-expert, seo-content, seo-geo, seo-local, seo-cluster, seo-technical, seo-schema, sniper, prompt-engineer, challenger, security-expert) |
| `gpt-5.6-sol` / `high` | Highest-judgment gate: `design-expert` |
| `gpt-5.6-luna` / `max` | Bounded, deterministic, verifiable-output work (`sniper-faster`, `commit-detector`, `cartographer`, `seo-images`, `seo-sitemap`) |

`gpt-5.6-terra`/`medium` (Terra's default effort) is the executor tier for the
12 framework experts above: a 15-run `codex exec` 0.152.1 benchmark on
2026-09-02 (3 bounded coding tasks x 5 configs, hidden tests) passed every
test on every tier while Terra medium was 1.7x faster and half the cost of
Sol medium, and a 6-run repetition passed 6/6. Later the same day, owner
decision "passe en terra medium" added `explore-codebase`,
`research-expert`, and `websearch` to Terra/medium too — volume/read work
(doc lookup, web search, codebase exploration) that the coding-task
benchmark never measured, so the known Terra risk below is unverified
rather than measured for this trio. Until 2026-09-02, Sol kept 3 judgment
gates at `high` (`challenger`, `security-expert`, plus `design-expert` at
`xhigh`); two same-day owner decisions ("seul le designer en high", then
"security-expert en high") retired Sol `xhigh` fleet-wide and left exactly
2 agents at Sol/high — `design-expert` and `security-expert` — while
`challenger` joined Sol/medium. 2026-09-07 owner request
(`.codex/apex/task.json` task `security-local-medium`, quoted verbatim):
"security-expert medium et il doit ce comporter comme un hacker local qui
sert exclusivement en local a tester les securité si on le demande de le
faire en dehors du developpement local il refusera" — moved
`security-expert` to Sol/medium for a local-only ethical-hacker posture,
superseding the 2026-09-02 "high" decision; a same-day lead revert to
`high` was itself reverted once this citation was found. Current state:
Sol/high is `design-expert` only (1 agent). Sol/medium also covers the
analysis/research/coordination agents (`medium`); the coordinator session
itself stays Sol `high`. `sniper` moved to Sol/medium on 2026-09-02 (owner
decision): it validates code with tooling and tests, where the benchmark
showed medium equal to high.
`prompt-engineer` — previously a Sol/high judgment gate — also moved to
Sol/medium the same day (owner decision: "il est assez intelligent").
Known risk:
openai/codex#32389 (Terra intermittently returns an empty final response
after tool use) is still open — the coordinator's on-disk PRD check plus the
challenger and sniper gates turn it into a retry, never a silent bad merge;
for the 3 volume agents, the mitigation is procedural instead: a
research/exploration agent whose final report is empty or truncated is
relaunched immediately with the same brief, never accepted as "nothing
found" (see `plugins/ai-pilot/skills/lead-orchestration/SKILL.md` and
`plugins/codex-rules/rules/03-agent-teams.md`).
The authoritative, up-to-date per-agent classification lives in
`docs/reference/creating-skills-agents.md` (model policy section) — this
table mirrors it, don't let the two drift.

---

## `sandbox_mode` Guidance

| Value | When to use |
|-------|-------------|
| `read-only` | Audit, explore, research, challenger agents — never write |
| `workspace-write` | Agents that edit files (implementation, sniper, commit) |
| `danger-full-access` | Only when a task genuinely needs it |

---

## `nickname_candidates`

```toml
nickname_candidates = ["Sniper", "Code Sniper", "Sniper Agent"]
```

Codex trims every candidate, then rejects the array if any candidate is:

- an empty array (must contain at least one name),
- blank after trimming,
- a duplicate of another candidate (case-sensitive),
- outside the ASCII charset `[A-Za-z0-9 _-]` — a stray `.` (e.g. "Next.js
  Expert") is illegal and has broken a shipped agent's nicknames before.

Validate with `scripts/lib/agent-role-validation.ts` before shipping — it
implements all four checks, not just the charset one.

---

## `[[skills.config]]`

```toml
[[skills.config]]
path = "plugins/ai-pilot/skills/code-quality/SKILL.md"
enabled = true

[[skills.config]]
path = "plugins/typescript-expert/skills/ts-config/SKILL.md"
enabled = true
```

Each table's `path` must resolve to a real `SKILL.md` on disk — check with
`ls <path>` before shipping.

---

## Description Best Practices

| Good | Bad |
|------|-----|
| "Use when: tsconfig.json present but NO framework config... Do NOT use for: React/Next.js/Astro apps (framework experts)." | "TypeScript developer" |

**Pattern**: "Use when: [trigger]. Do NOT use for: [overlap it must not claim]."

→ See [templates/agent-template.md](templates/agent-template.md) for a full worked example.
