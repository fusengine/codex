---
name: changelog-scan
description: "Scan Codex CLI changelog for new versions, features, and changes. Fetches official docs, parses release notes, and generates structured update report."
references: references/sources.md, references/templates/changelog-report.md
related-skills: breaking-changes, watch
---


# Changelog Scan Skill

## Overview

Fetches and analyzes the official Codex CLI changelog to detect new versions and changes.

## Data Sources

| Source | URL | Method |
|--------|-----|--------|
| Changelog | developers.openai.com/codex/changelog | fuse-browser fetch |
| CLI docs | developers.openai.com/codex/cli | fuse-browser fetch |
| CLI reference | developers.openai.com/codex/cli/reference | fuse-browser fetch |
| Config docs | developers.openai.com/codex/config-basic | fuse-browser fetch |

## Workflow

1. **Fetch** changelog via `mcp__fuse-browser__browser_fetch` or Exa
2. **Parse** version numbers and release dates
3. **Extract** changes per version (features, fixes, breaking)
4. **Compare** with last known version from state file
5. **Generate** report using templates/changelog-report.md

## Version Detection

Parse patterns from changelog:
- `## vX.Y.Z` or `## X.Y.Z` - Version headers
- `### Breaking Changes` - Breaking section
- `### New Features` - Features section
- `### Bug Fixes` - Fixes section

## References

- [Sources Reference](references/sources.md)
- [Report Template](references/templates/changelog-report.md)
