---
name: required-sections
description: Mandatory content sections for agent files
---

# Required Sections

## Overview

Every agent's `developer_instructions` body must include these sections.

---

## Section Order

1. Agent Workflow (MANDATORY)
2. MANDATORY SKILLS USAGE
3. SOLID Rules
4. Local Documentation
5. Quick Reference
6. Gemini Design (UI agents only)
7. Forbidden Patterns

---

## 1. Agent Workflow (MANDATORY)

```markdown
## Agent Workflow (MANDATORY)

Before ANY implementation, spawn 3 subagents in parallel (one dispatch, `spawn_agent` / MultiAgentV2):

1. **explore-codebase** - Analyze [domain] patterns
2. **research-expert** - Verify latest [tech] docs via Context7/Exa
3. **mcp__context7__query-docs** - Check [specific] patterns (direct MCP call)

After implementation, run **sniper** for validation.
```

---

## 2. MANDATORY SKILLS USAGE

```markdown
## MANDATORY SKILLS USAGE (CRITICAL)

**You MUST use your skills for EVERY task.**

| Task | Required Skill |
|------|----------------|
| Architecture | `solid-[stack]` |
| [Domain A] | `skill-a` |
| [Domain B] | `skill-b` |

**Workflow:**
1. Identify the task domain
2. Load the corresponding skill(s)
3. Follow skill documentation strictly
```

---

## 3. SOLID Rules

```markdown
## SOLID Rules (MANDATORY)

**See the `solid-[stack]` skill for complete rules.**

| Rule | Requirement |
|------|-------------|
| Files | < 100 lines (split at 90) |
| Interfaces | `[location]` ONLY |
| Documentation | JSDoc on every function |
| Validation | `sniper` after changes |
```

---

## 4. Local Documentation

```markdown
## Local Documentation (PRIORITY)

**Check local skills first before Context7:**

```
skills/[skill-a]/       # Description
skills/[skill-b]/       # Description
```
```

---

## 5. Quick Reference

```markdown
## Quick Reference

### [Domain A]

| Feature | Documentation |
|---------|---------------|
| Feature 1 | `skill-a/references/` |
```

---

## 6. Gemini Design (UI Agents)

```markdown
## GEMINI DESIGN MCP (MANDATORY FOR ALL UI)

**NEVER write UI code yourself. ALWAYS use Gemini Design MCP.**

| Tool | Usage |
|------|-------|
| `create_frontend` | Complete views |
| `modify_frontend` | Surgical changes |
| `snippet_frontend` | Isolated components |
```

---

## 7. Forbidden Patterns

```markdown
## Forbidden

- **Using emojis as icons** - Use Lucide React only
- **[Anti-pattern]** - [Alternative]
```

→ See [templates/agent-template.md](templates/agent-template.md) for complete example
