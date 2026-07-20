---
name: breaking-changes
description: "Detect breaking changes in Codex updates by comparing the current API surface against the changelog. Maps impacts to specific plugin files. Use when: checking whether a Codex update breaks our plugin ecosystem (hooks, agent TOML frontmatter, plugin manifest schema, or skill format)."
---

# Breaking Changes Detection Skill

## Overview

Compares Codex API changes against our plugin ecosystem to detect compatibility issues. "Our plugins" are the Codex plugins in this marketplace; the host whose changes can break them is Codex itself.

## API Surface File

The `api-surface.md` reference records our current known Codex API:
- Hook events and their matchers (`hooks.json`)
- Agent TOML fields (`name`, `description`, `developer_instructions`, `model`, `model_reasoning_effort`, `sandbox_mode`, `[[skills.config]]`, …)
- Plugin manifest schema (`.codex-plugin/plugin.json`)
- Skill `SKILL.md` format (name + description frontmatter)
- MCP declaration schema (`.mcp.json`)
- Script CLI flags used

## Detection Workflow

1. **Load** the current `api-surface.md`.
2. **Fetch** the latest Codex release notes and config/CLI docs (`openai/codex`).
3. **Diff** for added / changed / removed APIs.
4. **Search** our plugins for each changed API (grep across `hooks.json`, agent `.toml`, `SKILL.md`, `.mcp.json`, scripts).
5. **Report** with `file:line` impact mapping.

## Impact Assessment

| Change Type | Severity | Example |
|-------------|----------|---------|
| Removed API | BREAKING | Hook event deleted |
| Changed schema | BREAKING | Agent TOML field renamed |
| New required field | BREAKING | Mandatory new param |
| Deprecated API | DEPRECATED | Old hook still works |
| New optional API | NEW | New hook event added |

## References

- [API Surface](references/api-surface.md)
- [Migration Guide Template](references/templates/migration-guide.md)
