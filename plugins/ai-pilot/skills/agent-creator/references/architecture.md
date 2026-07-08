---
name: architecture
description: Codex agent file structure and organization
when-to-use: Understanding how agents are organized in plugins
keywords: architecture, structure, directory, files, plugin, codex
priority: high
related: frontmatter.md, registration.md
---

# Agent Architecture

## Overview

Agents in this repository are Codex custom-agent TOML files packaged inside plugin directories.

---

## Directory Structure

```
plugins/<plugin-name>/
├── agents/
│   └── <agent-name>.toml    # Codex custom agent definition
├── skills/
│   ├── skill-a/
│   │   ├── SKILL.md
│   │   └── references/
│   └── solid-[stack]/
├── scripts/
│   └── validate-*.ts        # Optional hook/runtime scripts
└── .codex-plugin/
    └── plugin.json          # Plugin manifest
```

---

## File Purposes

| File | Purpose |
|------|---------|
| `agents/<name>.toml` | Codex agent config with `developer_instructions` |
| `skills/*/SKILL.md` | Skill entry points loaded by Codex |
| `hooks/hooks.json` | Plugin hook wiring when the plugin uses hooks |
| `.codex-plugin/plugin.json` | Plugin metadata and local paths |

---

## Agent TOML Structure

```toml
name = "agent-name"
description = "When Codex should select this agent."
model = "gpt-5.5"
sandbox_mode = "workspace-write"
developer_instructions = '''
# Agent Title

## Agent Workflow (MANDATORY)
...

## Skills Usage
...

## Output Format
...
'''
```

Required keys: `name`, `description`, `developer_instructions`.
Common optional keys: `model`, `sandbox_mode`, `mcp_servers`, `skills.config`.

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Plugin folder | kebab-case | `nextjs-expert` |
| Agent file | kebab-case.toml | `nextjs-expert.toml` |
| Skill folder | kebab-case | `solid-nextjs` |
| Hook config | `hooks/hooks.json` | `plugins/ai-pilot/hooks/hooks.json` |

---

## Best Practices

| DO | DON'T |
|----|-------|
| Keep one primary expert agent per plugin | Create competing agents with overlapping triggers |
| Put operational rules in `developer_instructions` | Use legacy YAML agent config |
| Use Codex subagent wording | Mention legacy subagent commands |
| Keep hooks in plugin hook config | Put hook blocks in agent TOML |
