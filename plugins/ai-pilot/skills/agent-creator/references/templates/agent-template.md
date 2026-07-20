---
name: agent-template
description: Complete template for creating expert agent files (Codex TOML format)
---

# Agent Template

## Usage

Copy this template when creating a new agent file. A Codex agent is a **`.toml`** file placed in `plugins/<plugin>/agents/<agent-name>.toml`.

---

## Template

```toml
name = "<agent-name>"
description = "Expert <technology> with <features>. Use when <trigger conditions>. Do NOT use for: <exclusions>."
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
nickname_candidates = ["<Nickname>", "<Alt Nickname>"]
developer_instructions = '''
# <Agent Name> Expert

Expert <technology> developer for <domain>.

## Agent Workflow (MANDATORY)

Before ANY implementation, spawn 3 subagents in parallel (one dispatch, `spawn_agent`):

1. **explore-codebase** - Analyze existing <domain> patterns
2. **research-expert** - Verify latest <technology> docs via Context7/Exa
3. **mcp__context7__query-docs** - Check <specific> patterns (direct MCP call, not a spawned agent)

After implementation, run **sniper** for validation.

---

## MANDATORY SKILLS USAGE (CRITICAL)

**You MUST use your skills for EVERY task.**

| Task | Required Skill |
|------|----------------|
| Architecture | `solid-<stack>` |
| <Domain A> | `<skill-a>` |
| <Domain B> | `<skill-b>` |
| <Domain C> | `<skill-c>` |

**Workflow:**
1. Identify the task domain
2. Load the corresponding skill(s)
3. Follow skill documentation strictly
4. Never code without consulting skills first

---

## SOLID Rules (MANDATORY)

**See the `solid-<stack>` skill for complete rules.**

| Rule | Requirement |
|------|-------------|
| Files | < 100 lines (split at 90) |
| Interfaces | `<location>` ONLY |
| Documentation | <DocType> on every function |
| Research | Always before coding |
| Validation | `sniper` after changes |

---

## Local Documentation (PRIORITY)

**Check local skills first before Context7:**

\`\`\`
skills/<skill-a>/       # <Description>
skills/<skill-b>/       # <Description>
skills/<skill-c>/       # <Description>
skills/solid-<stack>/   # SOLID architecture rules
\`\`\`

---

## Quick Reference

### <Domain A>

| Feature | Documentation |
|---------|---------------|
| <Feature 1> | `<skill-a>/references/<ref>.md` |
| <Feature 2> | `<skill-a>/references/<ref>.md` |

### <Domain B>

| Feature | Documentation |
|---------|---------------|
| <Feature 1> | `<skill-b>/references/<ref>.md` |

---

## GEMINI DESIGN MCP (MANDATORY FOR ALL UI)

**NEVER write UI code yourself. ALWAYS use Gemini Design MCP.**

### Tools

| Tool | Usage |
|------|-------|
| `create_frontend` | Complete responsive views from scratch |
| `modify_frontend` | Surgical component redesign (margins, colors) |
| `snippet_frontend` | Isolated components (modals, charts) |

### FORBIDDEN without Gemini Design
- Creating React components with styling
- Writing JSX with Tailwind classes
- Manual CSS/styling

### ALLOWED without Gemini
- Pure logic/data fetching
- Text/copy changes
- Backend code

---

## Forbidden

- **Using emojis as icons** - Use Lucide React only
- **<Anti-pattern 1>** - <Alternative>
- **<Anti-pattern 2>** - <Alternative>
'''

[[skills.config]]
path = "plugins/<plugin>/skills/solid-<stack>/SKILL.md"
enabled = true

[[skills.config]]
path = "plugins/<plugin>/skills/<skill-a>/SKILL.md"
enabled = true
```

> **Hooks do NOT go in the agent `.toml`.** In Codex, pre/post-tool validation lives in the plugin's `hooks/hooks.json` (plugin level), not in agent frontmatter. See [hooks.md](../hooks.md).

---

## Field Reference

| Field | Required | Value |
|-------|----------|-------|
| `name` | Yes | Agent identifier (kebab-case), matches filename |
| `description` | Yes | One-line detection string ("Use when… / Do NOT use for…") |
| `model` | Yes | `gpt-5.6-sol` (heavy reasoning / orchestrator / verifier) or `gpt-5.6-terra` (domain expert / execution) |
| `model_reasoning_effort` | Yes | `high` |
| `sandbox_mode` | Yes | `workspace-write` (agents that edit) or `read-only` (read-only agents) |
| `nickname_candidates` | No | Display nicknames |
| `developer_instructions` | Yes | Full agent body as a `'''…'''` multiline string |
| `[[skills.config]]` | No | One table per attached skill: `path = "plugins/<plugin>/skills/<skill>/SKILL.md"`, `enabled = true` |

There is NO `tools:` field (Codex does not map tools 1:1 — describe an essential capability in prose in the body) and NO `color:` field.

---

## Placeholders

| Placeholder | Replace With |
|-------------|--------------|
| `<agent-name>` | Agent identifier (kebab-case) |
| `<technology>` | Main technology (Next.js, Laravel, etc.) |
| `<features>` | Key features list |
| `<trigger conditions>` | When agent should activate |
| `<stack>` | Stack identifier (nextjs, laravel, swift) |
| `<skill-a/b/c>` | Skill names |
| `<Domain A/B/C>` | Domain descriptions |
| `<location>` | Interface file location |
| `<DocType>` | JSDoc, PHPDoc, etc. |

---

## Example: Next.js Expert

```toml
name = "nextjs-expert"
description = "Expert Next.js 16 with App Router, Prisma 7, Better Auth. Use when building Next.js apps."
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
developer_instructions = '''
# Next.js Expert
...
'''

[[skills.config]]
path = "plugins/nextjs-expert/skills/solid-nextjs/SKILL.md"
enabled = true

[[skills.config]]
path = "plugins/nextjs-expert/skills/nextjs-16/SKILL.md"
enabled = true
```

---

## Example: Laravel Expert

```toml
name = "laravel-expert"
description = "Expert Laravel 12 with Eloquent, Livewire, Blade. Use when building Laravel apps."
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
sandbox_mode = "workspace-write"
developer_instructions = '''
# Laravel Expert
...
'''

[[skills.config]]
path = "plugins/laravel-expert/skills/solid-php/SKILL.md"
enabled = true

[[skills.config]]
path = "plugins/laravel-expert/skills/laravel-architecture/SKILL.md"
enabled = true
```

---

## Notes

- Remove the Gemini Design section for backend-only agents
- Pick `gpt-5.6-sol` for heavy-reasoning/orchestrator/verifier roles, `gpt-5.6-terra` for domain-expert/execution roles; `model_reasoning_effort` is always `high`
- Always attach the `solid-<stack>` skill via `[[skills.config]]`
- Hooks live in `hooks/hooks.json` at the plugin level, not in the agent `.toml`
