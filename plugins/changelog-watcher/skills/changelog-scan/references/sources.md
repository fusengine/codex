---
name: sources
description: Official Codex CLI documentation URLs and fetch strategies
when-to-use: When fetching Codex CLI updates from official sources
keywords: urls, docs, changelog, fetch, codex-code
priority: high
related: templates/changelog-report.md
---

# Codex CLI Documentation Sources

## Primary Sources

| Page | URL | Content |
|------|-----|---------|
| Changelog | `https://developers.openai.com/codex/changelog` | Release notes |
| CLI overview | `https://developers.openai.com/codex/cli` | Install, upgrade, release links |
| CLI reference | `https://developers.openai.com/codex/cli/reference` | Commands/flags |
| Skills | `https://developers.openai.com/codex/skills` | Skill format |
| Subagents | `https://developers.openai.com/codex/subagents` | Agent TOML config |
| Config | `https://developers.openai.com/codex/config-basic` | Config scopes and MCP |

## Fetch Strategy

1. Start with the official changelog for version updates
2. Fetch CLI/reference pages for commands and config changes
3. Fetch skills/subagents pages for schema changes
4. Compare page count/content with last check

## New Page Detection

If official Codex navigation exposes new relevant pages:
- New page = likely new feature
- Tag as `[NEW]` in report
- Fetch and analyze the new page
