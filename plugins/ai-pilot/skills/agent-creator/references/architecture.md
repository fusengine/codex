---
name: architecture
description: Agent file structure and organization
---

# Agent Architecture

## Overview

Agents live in plugin directories and reference skills for domain knowledge. Codex agents are TOML files; at runtime they resolve under `.codex/agents/`.

---

## Directory Structure

```
plugins/<plugin-name>/
├── agents/
│   └── <agent-name>.toml    # Agent definition file (TOML)
├── skills/
│   ├── skill-a/             # Domain skills
│   │   ├── SKILL.md
│   │   └── references/
│   └── solid-[stack]/       # SOLID rules for this stack
├── hooks/
│   └── hooks.json           # Pre/Post-tool validation (plugin level)
├── scripts/
│   └── validate-*.sh        # Hook validation scripts
└── .codex-plugin/
    └── plugin.json          # Plugin manifest
```

---

## File Purposes

| File | Purpose |
|------|---------|
| `agents/<name>.toml` | Agent definition: TOML fields + `developer_instructions` body |
| `skills/*/SKILL.md` | Skill entry points the agent can access |
| `hooks/hooks.json` | Pre/Post-tool validation wiring |
| `scripts/*.sh` | Hook scripts for validation |
| `plugin.json` | Plugin metadata and paths |

---

## Agent File Structure

```toml
name = "agent-name"
description = "..."
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
developer_instructions = '''
# Agent Title

## Agent Workflow (MANDATORY)
... (spawns subagents in parallel via spawn_agent / MultiAgentV2, one dispatch)

## MANDATORY SKILLS USAGE
...

## SOLID Rules
...

## Local Documentation
...

## Quick Reference
...
'''

[[skills.config]]
path = "plugins/<plugin>/skills/solid-<stack>/SKILL.md"
enabled = true
```

→ See [required-sections.md](required-sections.md) for section details

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Plugin folder | kebab-case | `nextjs-expert` |
| Agent file | kebab-case.toml | `nextjs-expert.toml` |
| Script file | validate-*.sh | `validate-nextjs-solid.sh` |
| Skill folder | kebab-case | `solid-nextjs` |

---

## Plugin Manifest

```json
// .codex-plugin/plugin.json
{
  "name": "nextjs-expert",
  "version": "1.0.0"
}
```

Agents (`agents/*.toml`) and skills (`skills/*/SKILL.md`) are auto-discovered from the plugin directory.

---

## Best Practices

| DO | DON'T |
|----|-------|
| One agent per plugin (main) | Multiple competing agents |
| Attach and reference the solid-[stack] skill | Duplicate SOLID rules |
| Use relative paths | Hard-code absolute paths |
| Keep the agent body focused | Put all docs in the agent file |
| Put hooks in hooks/hooks.json | Put hooks in the agent .toml |
