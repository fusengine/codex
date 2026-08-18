# Agents

37 specialized Codex agents across all plugins.

## Model Policy

The 37-agent policy assigns model and effort by named role, not by the Claude
source tier. Standard implementation and domain specialists use
`gpt-5.6-sol` / `medium` (22); high-stakes reasoning roles use
`gpt-5.6-sol` / `high` (7); `design-expert` uses `gpt-5.6-sol` / `xhigh`.
Six bounded mechanical roles use `gpt-5.6-luna` / `max`; `commit` remains
`gpt-5.6-terra` / `high`.

The exact groups are: Sol/medium — `astro-expert`, `changelog-watcher`,
`explore-codebase`, `go-expert`, `laravel-expert`, `nextjs-expert`,
`php-expert`, `react-expert`, `rust-expert`, `seo-cluster`, `seo-content`,
`seo-expert`, `seo-geo`, `seo-local`, `seo-schema`, `seo-technical`,
`shadcn-ui-expert`, `swift-expert`, `tailwindcss-expert`,
`tanstack-start-expert`, `typescript-expert`, `websearch`; Sol/high —
`brainstorming`, `challenger`, `prompt-engineer`, `research-expert`,
`security-expert`, `sniper`, `solid-orchestrator`; Luna/max —
`cartographer`, `commit-detector`, `lessons-compactor`, `seo-images`,
`seo-sitemap`, `sniper-faster`.

Every agent defines identity-based `nickname_candidates`; generic placeholder
pools are not valid defaults.

Every agent lists its relevant skills through `[[skills.config]]` entries that
point to installed cache `SKILL.md` files under
`/Users/<username>/.codex/plugins/cache/fusengine-codex/<plugin>/<version>/`.

## Inventory

| Plugin | Agents |
|--------|--------|
| `ai-pilot` | `brainstorming`, `explore-codebase`, `research-expert`, `sniper`, `sniper-faster`, `websearch` |
| `astro-expert` | `astro-expert` |
| `cartographer` | `cartographer` |
| `changelog-watcher` | `changelog-watcher` |
| `commit-pro` | `commit-detector` |
| `design-expert` | `design-expert` |
| `go-expert` | `go-expert` |
| `laravel-expert` | `laravel-expert` |
| `nextjs-expert` | `nextjs-expert` |
| `php-expert` | `php-expert` |
| `prompt-engineer` | `prompt-engineer` |
| `react-expert` | `react-expert` |
| `rust-expert` | `rust-expert` |
| `security-expert` | `security-expert` |
| `seo` | `seo-cluster`, `seo-content`, `seo-expert`, `seo-geo`, `seo-images`, `seo-local`, `seo-schema`, `seo-sitemap`, `seo-technical` |
| `shadcn-expert` | `shadcn-ui-expert` |
| `solid` | `solid-orchestrator` |
| `swift-apple-expert` | `swift-expert` |
| `tailwindcss` | `tailwindcss-expert` |
| `tanstack-start-expert` | `tanstack-start-expert` |
| `typescript-expert` | `typescript-expert` |

## Agent Teams

Agents can work in parallel when the active Codex runtime exposes a subagent or
team capability. Fusengine configures the Codex 0.144.1 native V2 tool under the
project-specific `fusengine_agents` namespace with spawn metadata visible. These are
runtime-proven internal knobs, not a stable public API. Keep file ownership
exclusive per teammate.

See [Agent Teams](agent-teams.md) for delegation rules, anti-patterns, and examples.

## Usage

Agents are launched automatically based on project detection, or manually:

```text
User: "Use nextjs-expert to fix the routing"
```

Or via the available subagent tool:

```typescript
fusengine_agents.spawn_agent({
  agent_type: "nextjs-expert",
  message: "Fix the routing issue",
  task_name: "fix_routing",
  fork_turns: "none",
})
```

`agent_type` selects the exact custom TOML. It must be paired with
`fork_turns = "none"` or a bounded positive history; the default/`"all"`
rejected role/model/reasoning overrides in the tested runtime. A returned
configured nickname is identity evidence; a task path is not.

## Hook Runtime

Agent lifecycle evidence is routed through `@fusengine/harness`. The migration
has no direct-command exception path: every configured command handler invokes
its canonical Harness route. Harness 0.1.79 still has Codex compatibility gaps
for design lifecycle, Claude-rooted state, and events Codex does not emit; see
[Hooks System](../reference/hooks.md#harness-0179-runtime-limits).
