---
name: SKILL-template
description: Complete template for creating SKILL.md files (Codex format)
---

# SKILL.md Template

## Usage

Copy this template when creating a new skill's SKILL.md file. A Codex skill frontmatter contains **only** `name` and `description`.

---

## Template

```markdown
---
name: <skill-name>
description: Use when <trigger conditions>. Covers <main topics>.
---

# <Skill Title>

> Targets <library> X.Y.Z / <framework> X.Y. (Put version info in prose — Codex frontmatter is name + description only.)

## Agent Workflow (MANDATORY)

Before ANY implementation, spawn 3 subagents in parallel (one dispatch, `spawn_agent` / MultiAgentV2):

1. **explore-codebase** - Analyze existing <domain> patterns
2. **research-expert** - Verify latest <library> docs via Context7/Exa
3. **mcp__context7__query-docs** - Check <specific> patterns (direct MCP call)

After implementation, run **sniper** for validation.

---

## Overview

| Feature | Description |
|---------|-------------|
| **<Feature 1>** | <Description> |
| **<Feature 2>** | <Description> |
| **<Feature 3>** | <Description> |

---

## Critical Rules

1. **<Rule 1>** - <Explanation>
2. **<Rule 2>** - <Explanation>
3. **<Rule 3>** - <Explanation>
4. **<Rule 4>** - <Explanation>
5. **<Rule 5>** - <Explanation>

---

## Architecture

\`\`\`
<project-structure>/
├── <folder>/
│   ├── <file>.ts
│   └── <file>.ts
└── <folder>/
    └── <file>.ts
\`\`\`

→ See [basic-setup.md](references/templates/basic-setup.md) for complete example

---

## Reference Guide

### Concepts

| Topic | Reference | When to Consult |
|-------|-----------|-----------------|
| **Installation** | [installation.md](references/installation.md) | Setting up <library> |
| **Core Concepts** | [core-concepts.md](references/core-concepts.md) | Understanding <topic> |
| **Patterns** | [patterns.md](references/patterns.md) | Common use cases |

### Templates

| Template | When to Use |
|----------|-------------|
| [basic-setup.md](references/templates/basic-setup.md) | Starting new project |
| [advanced-example.md](references/templates/advanced-example.md) | Complex scenarios |

---

## Quick Reference

### <Common Pattern 1>

\`\`\`typescript
// Minimal example
\`\`\`

→ See [template.md](references/templates/template.md) for complete example

### <Common Pattern 2>

\`\`\`typescript
// Minimal example
\`\`\`

→ See [template.md](references/templates/template.md) for complete example

---

## Best Practices

### DO
- <Best practice 1>
- <Best practice 2>
- <Best practice 3>

### DON'T
- <Anti-pattern 1>
- <Anti-pattern 2>
- <Anti-pattern 3>
```

---

## Placeholders

| Placeholder | Replace With |
|-------------|--------------|
| `<skill-name>` | Skill folder name (kebab-case) |
| `<library>` | Main library name |
| `<framework>` | Framework if applicable |
| `<trigger conditions>` | When skill should activate |
| `<main topics>` | What skill covers |
| `<Feature N>` | Key features |
| `<Rule N>` | Critical rules |

---

## Example Filled

```markdown
---
name: tanstack-query
description: Use when fetching, caching, or synchronizing server data. Covers queries, mutations, caching, and optimistic updates.
---

# TanStack Query

> Targets TanStack Query 5.67.2 / React 19.
```
