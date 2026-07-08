---
name: frontmatter
description: Codex agent TOML configuration
when-to-use: Configuring agent metadata, model, sandbox, MCP, and skills
keywords: toml, config, agent, model, sandbox, mcp, skills
priority: high
related: architecture.md, hooks.md
---

# Agent TOML

## Overview

Codex agents use standalone TOML config files. This reference keeps the legacy filename `frontmatter.md`, but new agents must not use YAML frontmatter.

---

## Minimal Agent

```toml
name = "research-expert"
description = "Technical research expert. Use when documentation or API behavior must be verified."
developer_instructions = '''
# Research Expert

Use official docs first, then cross-check with Exa or browser fetch.
Return findings with sources.
'''
```

---

## Common Agent

```toml
name = "nextjs-expert"
description = "Expert Next.js agent. Use when next.config.* or app/ is detected."
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
nickname_candidates = ["Nextjs Expert", "Nextjs Expert Specialist", "Nextjs Expert Agent"]
sandbox_mode = "workspace-write"
developer_instructions = '''
# Next.js Expert Agent

## Agent Workflow (MANDATORY)

Use available Codex subagents when they materially help:
1. explore-codebase for local patterns
2. research-expert for current official docs

Close spawned subagents after final status is reviewed and integrated.

## Output Format

status: pass | fail | degraded
files_changed: []
sources: []
'''

[[skills.config]]
path = "/Users/<username>/.codex/plugins/cache/fusengine-codex/nextjs-expert/<version>/skills/nextjs-16/SKILL.md"
enabled = true
```

---

## Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Agent identifier; matching filename is the simplest convention |
| `description` | Yes | Trigger guidance used by Codex |
| `developer_instructions` | Yes | Full behavior contract for the spawned agent |
| `model` | No | Model override for this agent |
| `model_reasoning_effort` | No | `high` for fast/basic agents, `xhigh` for deep code/design/security/research agents |
| `nickname_candidates` | No | Display names derived from the agent identity, never generic placeholders |
| `sandbox_mode` | No | `read-only`, `workspace-write`, or `danger-full-access` |
| `mcp_servers` | No | Per-agent MCP overrides when needed |
| `skills.config` | No | Per-agent skill config when needed |

---

## Forbidden

- Do not use legacy tool allow-lists.
- Do not use legacy subagent primitives.
- Do not put hook blocks in agent TOML.
- Do not use generic nickname placeholders.
