---
name: agent-creator
description: Use when creating expert agents. Generates an agent .toml with the required fields, attached skills, and required sections.
---

# Agent Creator

## Agent Workflow (MANDATORY)

Before ANY agent creation, spawn 2 subagents in parallel (one dispatch, `spawn_agent`). Generated agents reference other agents by their bare `name` via `spawn_agent` too, so this same pattern is what they must use internally:

1. **explore-codebase** - Check existing agents, analyze patterns
2. **research-expert** - Fetch latest agent conventions

`mcp__context7__query-docs` is a direct MCP call, not a spawned agent — invoke it directly (alongside the 2 subagents) to get examples from existing agents.

After creation, run **sniper** for validation.

---

## Overview

| Action | When to Use |
|--------|-------------|
| **New Agent** | New domain/framework expert needed |
| **Adapt** | Copy from similar agent (Next.js → React) |
| **Update** | Add skills, modify sections |

---

## Critical Rules

1. **ALL content in English** - Never French or other languages
2. **TOML fields complete** - `name`, `description`, `model`, `model_reasoning_effort`, `sandbox_mode`, `developer_instructions`, `[[skills.config]]`
3. **Agent Workflow section** - Always first content section (inside `developer_instructions`)
4. **SOLID rules reference** - Attach and link the `solid-<stack>` skill
5. **Register in the plugin manifest** - Or the agent won't load
6. **Hooks live in `hooks/hooks.json`** - Plugin level, never in the agent `.toml`
7. **Output Format section mandatory** - Every generated agent must define a standard `## Output Format` section (status, files_changed, errors, sources) — an agent invoked by a lead must return structured data, not prose

---

## Architecture

```
plugins/<plugin-name>/
├── agents/
│   └── <agent-name>.toml    # Agent definition (TOML)
├── skills/
│   ├── skill-a/
│   └── solid-[stack]/
├── hooks/
│   └── hooks.json           # Pre/Post-tool validation (plugin level)
├── scripts/
│   └── validate-*.sh        # Hook scripts
└── .codex-plugin/
    └── plugin.json
```

→ See [architecture.md](references/architecture.md) for details

---

## Reference Guide

### Concepts

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Architecture** | [architecture.md](references/architecture.md) | Understanding agent structure |
| **Frontmatter** | [frontmatter.md](references/frontmatter.md) | TOML field configuration |
| **Required Sections** | [required-sections.md](references/required-sections.md) | Mandatory content |
| **Hooks** | [hooks.md](references/hooks.md) | Pre/Post tool validation |
| **Registration** | [registration.md](references/registration.md) | Plugin manifest |

### Templates

| Template | When to Use |
|----------|-------------|
| [agent-template.md](references/templates/agent-template.md) | Creating new agent |
| [hook-scripts.md](references/templates/hook-scripts.md) | Validation scripts |

---

## Quick Reference

### Create New Agent

```bash
# 1. Research existing agents
→ explore-codebase + research-expert

# 2. Create files
touch plugins/<plugin>/agents/<agent-name>.toml
touch plugins/<plugin>/scripts/validate-<stack>-solid.sh
chmod +x plugins/<plugin>/scripts/*.sh

# 3. Register in the plugin manifest

# 4. Validate
→ sniper
```

### Adapt Existing Agent

```bash
# 1. Copy similar agent
cp plugins/nextjs-expert/agents/nextjs-expert.toml plugins/new-plugin/agents/new-expert.toml

# 2. Adapt with sed
sed -i '' "s/nextjs/newstack/g; s/Next\.js/NewStack/g" agents/new-expert.toml

# 3. Update skills, model, register
```

---

## Validation Checklist

- [ ] ALL content in English
- [ ] TOML fields complete (`name`, `description`, `model`, `model_reasoning_effort`, `sandbox_mode`, `developer_instructions`)
- [ ] Agent Workflow section present
- [ ] Mandatory Skills Usage table
- [ ] SOLID Rules reference to `solid-[stack]`, attached via `[[skills.config]]`
- [ ] Local Documentation paths valid
- [ ] Output Format section present (status, files_changed, errors, sources)
- [ ] Hook scripts executable, wired in `hooks/hooks.json`
- [ ] Registered in the plugin manifest

---

## Related: Skill Creator

**When creating an agent, you often need to create skills too.**

Use the **`skill-creator`** skill (`$skill-creator`) to create skills for the agent:

| Scenario | Action |
|----------|--------|
| New agent needs skills | Create skills with skill-creator first |
| Agent references skills | Ensure skills exist in skills/ |
| Adapting agent | Adapt related skills too |

---

## Best Practices

### DO
- Use skill-creator for associated skills
- Attach and reference the `solid-[stack]` skill for SOLID rules
- Include a Gemini Design section for UI agents
- Make hook scripts executable
- Wire hooks in `hooks/hooks.json`

### DON'T
- Write in French (English only)
- Skip the Agent Workflow section
- Forget manifest registration
- Create an agent without its skills
- Hard-code paths in hooks (use `$PLUGIN_ROOT`)
- Put hooks in the agent `.toml`
