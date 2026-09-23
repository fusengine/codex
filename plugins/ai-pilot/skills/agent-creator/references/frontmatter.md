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
model = "gpt-6-sol"
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
| `model` | Recommended | Explicit tier id only: `gpt-6-sol` or `gpt-6-luna`, chosen per Model Selection below. Never the bare `gpt-6` alias. GPT-6 has no `terra` tier and `gpt-6-astra` is excluded fleet-wide on cost. |
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

**Current, since 2026-09-23** (owner decision, verbatim, in order: "supprime
astra il coute chere" · "j'ai trouvé luna medium plus performant" · "donc on
répartie comment les model et raisonnement sur luna le high on oublie je
pense non?" · "appliquer"). The fleet moved from GPT-5.6 (Sol/Terra/Luna) to
GPT-6 (Sol/Astra/Luna); `gpt-6-astra` is excluded fleet-wide on cost, and
GPT-6 has no `terra` tier.

| `model` / effort | When to use |
|-------------------|-------------|
| `gpt-6-sol` / `medium` | 18 orchestration/release/exploration/research/validation/prompt-design/security-audit agents (brainstorming, challenger, commit, explore-codebase, research-expert, sniper, changelog-watcher, lessons-compactor, prompt-engineer, security-expert, seo-cluster, seo-content, seo-expert, seo-geo, seo-local, seo-schema, seo-technical, solid-orchestrator) |
| `gpt-6-sol` / `high` | Highest-judgment gate: `design-expert` |
| `gpt-6-luna` / `medium` | The 12 framework/stack experts (astro, go, laravel, nextjs, php, react, rust, shadcn-ui, swift, tailwindcss, tanstack-start, typescript) + `sniper-faster`, `websearch`, `cartographer`, `commit-detector`, `seo-images`, `seo-sitemap` — 18 total, bounded/mechanical work with a strict, verifiable contract |

Rationale: Luna medium writes code and does mechanical work — measured the
same correctness as Sol on debugging/typed-code tasks, roughly 30x cheaper
than Sol, fastest, and does not loop at medium effort. Sol medium judges,
validates, explores, and researches — the only arm with zero edge-case
misses in testing; `challenger` and `sniper` (both Sol/medium) review
Luna's output. `research-expert` and `explore-codebase` sit on Sol/medium
(not Luna) because exploration/research is judgment-adjacent under this
rationale; `websearch` sits on Luna/medium as bounded mechanical lookup.
`gpt-6-luna` / `high` is dropped (slow and erratic at that effort);
`gpt-6-sol` / `low` is dropped (no better than Luna medium, at 14x the
cost). Valid efforts per the GPT-6 catalog: `gpt-6-sol` supports `low`
through `ultra`; `gpt-6-luna` supports `low` through `max` — this fleet
uses only Sol medium (plus one Sol high) and Luna medium. Prices per 1M
tokens (input/cached/output, developers.openai.com/api/docs/pricing):
`gpt-6-sol` $2.00/$0.20/$10.00, `gpt-6-luna` $0.10/$0.01/$0.50.
The authoritative, up-to-date per-agent classification lives in
`docs/reference/creating-skills-agents.md` (model policy section) — this
table mirrors it, don't let the two drift.

### History (GPT-5.6 tiers, superseded 2026-09-23)

For the full prior GPT-5.6 Sol/Terra/Luna policy (per-tier rationale, the
owner decision timeline, and the known Terra risk) see
[`docs/workflow/agents.md` § History (GPT-5.6 policy, superseded
2026-09-23)](../../../../../docs/workflow/agents.md#history-gpt-56-policy-superseded-2026-09-23)
— condensed here to a pointer, not reproduced, to avoid the two copies
drifting.

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
