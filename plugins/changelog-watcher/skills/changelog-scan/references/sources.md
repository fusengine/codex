---
name: sources
description: Official Codex release/documentation sources and fetch strategies
when-to-use: When fetching Codex updates from official sources
keywords: urls, docs, changelog, fetch, codex, openai
priority: high
related: templates/changelog-report.md
---

# Codex Documentation Sources

The host platform is Codex (the `openai/codex` CLI). Its release notes and docs live in the GitHub repository.

## Primary Sources

| Page | Location | Content |
|------|----------|---------|
| Releases | `github.com/openai/codex/releases` | Tagged release notes |
| Changelog | `github.com/openai/codex/blob/main/CHANGELOG.md` (raw) | Consolidated release notes |
| Docs tree | `github.com/openai/codex/tree/main/docs` | All doc pages |
| Config reference | `docs/config.md` | `config.toml`, model/effort/sandbox keys |
| Agents | `docs/` agent pages | Agent TOML config, `spawn_agent` |
| Skills | `docs/` skill pages | `SKILL.md` format |
| Hooks | `docs/` hooks pages | Hook events / `hooks.json` |
| MCP | `docs/` MCP pages | MCP server config (`.mcp.json`) |
| CLI reference | `docs/` CLI pages | Commands / flags |

## Fetch Strategy

1. List tagged releases via `gh api repos/openai/codex/releases` to detect new versions.
2. Fetch the raw `CHANGELOG.md` for consolidated notes.
3. Fetch the config/agents/hooks/MCP doc pages for schema changes.
4. Compare page count / content with the last check.

Prefer `browser_fetch` / `browser_fetch_batch` (fast-path, no live browser) and batch the URLs.

## New Page / Feature Detection

If the `docs/` tree has new pages not seen in the previous check, or a release introduces a new config key / hook event / agent field:
- New page or key = likely new feature
- Tag as `[NEW]` in the report
- Fetch and analyze it
