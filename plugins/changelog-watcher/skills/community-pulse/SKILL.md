---
name: community-pulse
description: "Use when gauging community sentiment, bug reports, or feature requests about Codex via Exa search."
---

<objective>
Gathers and analyzes community feedback about Codex — real-world usage patterns, bug reports, and feature requests from blogs, forums, and social media — using Exa search tools. Two modes: quick (default, `web_search` for recent mentions) or deep (`--deep`, `deep_researcher` for comprehensive analysis). Searches five priority categories (updates, bugs, plugins, comparisons, tips), classifies each result's sentiment (positive/neutral/negative), and reports actionable insights with sources.
</objective>

# Community Pulse Skill

## Overview

Gathers and analyzes community feedback about Codex using Exa search tools.

## Modes

- **Quick** (default): Exa web_search for recent mentions
- **Deep** (--deep): Exa deep_researcher for comprehensive analysis

## Search Categories

| Category | Exa Query | Priority |
|----------|-----------|----------|
| Updates | `"Codex" release OR update 2026` | HIGH |
| Bugs | `"Codex" bug OR issue OR broken` | HIGH |
| Plugins | `"Codex" plugin OR hooks experience` | MEDIUM |
| Comparison | `"Codex" vs Cursor OR Windsurf` | LOW |
| Tips | `"Codex" tips OR workflow OR best practices` | MEDIUM |

## Workflow

1. **Search** using category-specific Exa queries
2. **Filter** for recent results (last 30 days)
3. **Analyze** sentiment (positive/neutral/negative)
4. **Extract** actionable insights
5. **Report** with sources and recommendations

## Sentiment Classification

| Signal | Classification |
|--------|---------------|
| "love", "amazing", "game changer" | Positive |
| "update", "released", "changed" | Neutral |
| "broken", "bug", "regression", "worse" | Negative |

## References

- [Exa Queries Reference](references/exa-queries.md)
- [Pulse Report Template](references/templates/pulse-report.md)
