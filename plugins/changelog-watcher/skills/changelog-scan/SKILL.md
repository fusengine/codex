---
name: changelog-scan
description: "Scan Codex CLI changelog for new versions, features, and changes. Fetches official docs, parses release notes, and generates structured update report."
---


# Changelog Scan Skill

## Overview

Fetches and analyzes the official Codex CLI changelog to detect new versions and changes.

## Data Sources

| Source | URL | Method |
|--------|-----|--------|
| Changelog | code.codex.com/docs/en/changelog.md | WebFetch |
| Docs Index | code.codex.com/docs/llms.txt | WebFetch |
| Hooks Ref | code.codex.com/docs/en/hooks.md | WebFetch |
| Plugins Ref | code.codex.com/docs/en/plugins-reference.md | WebFetch |
| CLI Ref | code.codex.com/docs/en/cli-reference.md | WebFetch |

## Workflow

1. **Fetch** changelog via WebFetch or scripts/fetch-changelog.sh
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

## State File

Location: `~/.codex/logs/00-changelog/{date}-state.json`

## References

- [Sources Reference](references/sources.md)
- [Report Template](references/templates/changelog-report.md)
