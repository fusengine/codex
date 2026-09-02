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
| `gpt-5.6-terra` / `medium` | The 12 framework/stack experts (astro, go, laravel, nextjs, php, react, rust, shadcn-ui, swift, tailwindcss, tanstack-start, typescript) |
| `gpt-5.6-sol` / `medium` | The 16 analysis/research/orchestration/release/validation agents (explore-codebase, research-expert, brainstorming, solid-orchestrator, commit, changelog-watcher, lessons-compactor, seo-expert, seo-content, seo-geo, seo-local, seo-cluster, seo-technical, seo-schema, websearch, sniper) |
| `gpt-5.6-sol` / `high` | One-shot-correctness gates: `challenger`, `security-expert`, `prompt-engineer` |
| `gpt-5.6-sol` / `xhigh` | Highest visual/product-direction judgment (`design-expert`) |
| `gpt-5.6-luna` / `max` | Bounded, deterministic, verifiable-output work (`sniper-faster`, `commit-detector`, `cartographer`, `seo-images`, `seo-sitemap`) |

`gpt-5.6-terra`/`medium` (Terra's default effort) is the executor tier for the
12 framework experts above: a 15-run `codex exec` 0.152.1 benchmark on
2026-09-02 (3 bounded coding tasks x 5 configs, hidden tests) passed every
test on every tier while Terra medium was 1.7x faster and half the cost of
Sol medium, and a 6-run repetition passed 6/6. Sol keeps the judgment roles
(`high`/`xhigh` above) and the analysis/research/coordination agents
(`medium`); the coordinator session itself stays Sol `high`. `sniper` moved
to Sol/medium on 2026-09-02 (owner decision): it validates code with
tooling and tests, where the benchmark showed medium equal to high; the
challenger keeps high for adversarial, fresh-context review. Known risk:
openai/codex#32389 (Terra intermittently returns an empty final response
after tool use) is still open — the coordinator's on-disk PRD check plus the
challenger and sniper gates turn it into a retry, never a silent bad merge.
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
