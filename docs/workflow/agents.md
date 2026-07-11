# Agents

34 specialized Codex agents across all plugins.

## Model Policy

Demanding planning, implementation, validation, design, security, framework,
and architecture agents use `model = "gpt-5.6-sol"` (16 agents).
Read-heavy, research, detection, focused SEO, and narrow support agents use
`model = "gpt-5.6-terra"` (18 agents).

All 34 custom agents set `model_reasoning_effort = "high"` explicitly.

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
its canonical Harness route. Harness 0.1.67 still has Codex compatibility gaps
for design lifecycle, Claude-rooted state, and events Codex does not emit; see
[Hooks System](../reference/hooks.md#harness-0167-runtime-limits).
