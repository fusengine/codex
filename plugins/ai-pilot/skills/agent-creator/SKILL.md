---
name: agent-creator
description: Use when creating expert agents. Generates Codex agent TOML with developer instructions, required sections, and skill references.
---

# Agent Creator

## Agent Workflow (MANDATORY)

Before ANY agent creation, use the available Codex subagent workflow when it materially helps. Suggested parallel checks:

1. **ai-pilot:exploration / explore-codebase** - Check existing agents, analyze patterns
2. **ai-pilot:research / research-expert** - Fetch latest agent conventions

`mcp__context7__query-docs` is a direct MCP call, not a spawned agent. Invoke it directly when current Codex documentation or examples are needed.

After creation, run **ai-pilot:sniper-check / sniper** for validation.

---

## Overview

| Action | When to Use |
|--------|-------------|
| **New Agent** | New domain/framework expert needed |
| **Adapt** | Copy from similar agent (Next.js → React) |
| **Update** | Add skills, modify hooks |

---

## Critical Rules

1. **ALL content in English** - Never French or other languages
2. **TOML complete** - `name`, `description`, and `developer_instructions` are mandatory
3. **Agent Workflow section** - First section inside `developer_instructions`
4. **SOLID rules reference** - Link to solid-[stack] skill when the stack has one
5. **Register in plugin metadata when required** - Or the agent may not load
6. **Plugin hooks stay in hooks config** - Do not put legacy hook blocks in agent TOML
7. **Output Format section mandatory** - Every generated agent must define a standard `## Output Format` section (status, files_changed, errors, sources) — an agent invoked by a lead must return structured data, not prose

---

## Architecture

```
plugins/<plugin-name>/
├── agents/
│   └── <agent-name>.toml    # Codex custom agent definition
├── skills/
│   ├── skill-a/
│   └── solid-[stack]/
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
| **Agent TOML** | [frontmatter.md](references/frontmatter.md) | Codex TOML configuration |
| **Required Sections** | [required-sections.md](references/required-sections.md) | Mandatory content |
| **Hooks** | [hooks.md](references/hooks.md) | Pre/Post tool validation |
| **Registration** | [registration.md](references/registration.md) | Plugin marketplace + `.codex-plugin/plugin.json` |

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

# 3. Register plugin metadata if this is a new plugin

# 4. Validate
→ sniper
```

### Adapt Existing Agent

```bash
# 1. Copy similar agent
cp plugins/nextjs-expert/agents/nextjs-expert.toml plugins/new-plugin/agents/new-expert.toml

# 2. Adapt with sed
sed -i '' "s/nextjs/newstack/g; s/Next\.js/NewStack/g" agents/new-expert.toml

# 3. Update skills, tools, register
```

---

## Validation Checklist

- [ ] ALL content in English
- [ ] TOML complete (`name`, `description`, `developer_instructions`)
- [ ] Agent Workflow section present
- [ ] Mandatory Skills Usage table
- [ ] SOLID Rules reference to solid-[stack]
- [ ] Local Documentation paths valid
- [ ] Output Format section present (status, files_changed, errors, sources)
- [ ] Hook scripts executable
- [ ] Plugin registration checked when needed

---

## Related: Skill Creator

**When creating an agent, you often need to create skills too.**

Use **`ai-pilot:skill-creator`** to create skills for the agent:

| Scenario | Action |
|----------|--------|
| New agent needs skills | Create skills with skill-creator first |
| Agent references skills | Ensure skills exist in skills/ |
| Adapting agent | Adapt related skills too |

---

## Best Practices

### DO
- Use skill-creator for associated skills
- Reference solid-[stack] skill for SOLID rules
- Include Gemini Design section for UI agents
- Make hook scripts executable

### DON'T
- Write in French (English only)
- Skip Agent Workflow section
- Forget marketplace registration
- Create agent without its skills
- Hard-code paths in hooks (use `$PLUGIN_ROOT`)
