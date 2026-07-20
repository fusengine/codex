---
name: changelog-scan
description: "Scan the Codex changelog for new versions, features, and changes. Fetches official release notes, parses them, and generates a structured update report. Use when: checking for new Codex versions, features, or changes since the last known release."
---

# Changelog Scan Skill

## Overview

Fetches and analyzes the official Codex release notes to detect new versions and changes. The host platform for this plugin ecosystem is Codex (the `openai/codex` CLI); this skill tracks its releases.

## Data Sources

| Source | Location | Method |
|--------|----------|--------|
| Releases | `github.com/openai/codex/releases` | `gh api repos/openai/codex/releases` or `browser_fetch` |
| Changelog | `github.com/openai/codex/blob/main/CHANGELOG.md` (raw) | `browser_fetch` |
| Docs index | `github.com/openai/codex` `docs/` tree | `browser_fetch` / `gh api` |
| Config / CLI reference | repo `docs/config.md` and `docs/` CLI pages | `browser_fetch` |

Prefer the fast-path fetchers (`browser_fetch` / `browser_fetch_batch`) — no live browser session — and batch several URLs in one call.

## Workflow

1. **Fetch** the release notes. Pull the tagged releases with `gh api repos/openai/codex/releases` (fall back to `browser_fetch` on the raw `CHANGELOG.md`). Treat it as a single fetch-parse-persist pass: retrieve the notes, parse each version block, persist the run state, and emit a JSON diff of what is new since the last check.
2. **Parse** version numbers and release dates from the tags / headers.
3. **Extract** changes per version (features, fixes, breaking).
4. **Compare** against the last known version stored in the state file.
5. **Generate** the report using `references/templates/changelog-report.md`.

## Version Detection

Parse these patterns from the release notes:
- Release tags `vX.Y.Z` / `rust-vX.Y.Z` and `## X.Y.Z` headers — version markers
- `### Breaking Changes` — breaking section
- `### New Features` / `### Added` — features section
- `### Bug Fixes` / `### Fixed` — fixes section

## State File

Location: `${CODEX_HOME}/logs/00-changelog/{date}-state.json` (`CODEX_HOME` defaults to `~/.codex`). Holds `{latest, new_since_last_check, recent_versions}` so consecutive scans only report the delta.

## References

- [Sources Reference](references/sources.md)
- [Report Template](references/templates/changelog-report.md)
