# Agents

34 specialized Codex agents across all plugins.

## Model Policy

All custom agents use `model = "gpt-5.5"`.

Fast/basic agents use `model_reasoning_effort = "high"`:
`brainstorming`, `websearch`, `sniper-faster`, `cartographer`,
`changelog-watcher`, `commit-detector`, `seo-cluster`, `seo-content`,
`seo-geo`, `seo-images`, `seo-local`, `seo-schema`, and `seo-sitemap`.

Deep validation, code, research, design, security, framework, and architecture
agents use `model_reasoning_effort = "xhigh"`.

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
team capability. Do not assume a fixed tool name; use app `spawn_agent`, CLI
slash commands, or project tooling as available. Keep file ownership exclusive
per teammate.

See [Agent Teams](agent-teams.md) for delegation rules, anti-patterns, and examples.

## Usage

Agents are launched automatically based on project detection, or manually:

```text
User: "Use nextjs-expert to fix the routing"
```

Or via the available subagent tool:

```typescript
spawn_agent({
  agent_type: "nextjs-expert",
  prompt: "Fix the routing issue",
})
```
