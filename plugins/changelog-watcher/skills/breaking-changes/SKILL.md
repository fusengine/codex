---
name: breaking-changes
description: "Detect breaking changes in Codex CLI updates by comparing current API surface against changelog. Maps impacts to specific plugin files."
references: references/api-surface.md, references/templates/migration-guide.md
related-skills: changelog-scan, watch
---


# Breaking Changes Detection Skill

## Overview

Compares Codex CLI API changes against our plugin ecosystem to detect compatibility issues.

## API Surface File

The `api-surface.md` reference contains our current known API:
- Hook types and their matchers
- Agent TOML fields
- Plugin manifest schema
- Skill SKILL.md format
- Script CLI flags used

## Detection Workflow

1. **Load** current api-surface.md
2. **Fetch** latest Codex CLI API docs from official OpenAI docs
3. **Diff** for added/changed/removed APIs
4. **Grep** our plugins for each changed API
5. **Report** with file:line impact mapping

## Impact Assessment

| Change Type | Severity | Example |
|-------------|----------|---------|
| Removed API | BREAKING | Hook type deleted |
| Changed schema | BREAKING | Frontmatter field renamed |
| New required field | BREAKING | Mandatory new param |
| Deprecated API | DEPRECATED | Old hook still works |
| New optional API | NEW | New hook type added |

## References

- [API Surface](references/api-surface.md)
- [Migration Guide Template](references/templates/migration-guide.md)
