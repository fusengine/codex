# fuse-ai-pilot

APEX workflow orchestrator with sniper validation and research capabilities.

## Agents

| Agent | Description |
|-------|-------------|
| `sniper` | 7-phase validation (DRY detection), zero linter errors |
| `sniper-faster` | Quick validation, minimal output |
| `explore-codebase` | Architecture discovery |
| `research-expert` | Documentation with Context7/Exa |
| `websearch` | Quick web research |
| `seo-expert` | SEO/SEA/GEO optimization |

## Commands

| Command | Description |
|---------|-------------|
| `/apex` | Full APEX workflow |
| `/apex-quick` | Quick APEX: Analyze (trio) -> Plan (one task) -> Execute (delegated) -> eLicit + challenger -> Verify + challenger -> full sniper — only Brainstorm is skipped |
| `/research` | Technical research |
| `/exploration` | Codebase discovery |
| `/code-quality` | Linters, SOLID validation, DRY detection |
| `/elicitation` | Self-review techniques |

## Skills

- `apex` - Full APEX methodology
- `apex-quick` - Quick APEX flow
- `research` - Research methodology
- `exploration` - Discovery techniques
- `code-quality` - Validation with DRY detection (jscpd)
- `elicitation` - Self-review (75 techniques)
- `skill-creator` - Create/restructure skills with SKILL.md + references/
- `agent-creator` - Create expert agents with frontmatter, hooks, skills
- `react-effects-audit` - Audit React useEffect anti-patterns (9 rules from "You Might Not Need an Effect")

## Cache System (fusengine)

4-level persistent cache to reduce redundant operations and save tokens (60-75% savings).

```
${CODEX_HOME:-~/.codex}/fusengine/
├── explore/{project-hash}/    # Architecture snapshots
│   ├── metadata.json
│   └── snapshot.md
├── doc/{project-hash}/        # Documentation cache
│   ├── index.json
│   └── docs/{doc-hash}.md
├── lessons/{project-hash}/    # Sniper error patterns
│   └── {timestamp}.json
├── tests/{project-hash}/      # Test results cache
│   └── results.json
└── analytics/
    └── sessions.jsonl         # Cache hit/miss tracking
```

### Cache Levels

| Cache | Source | TTL | Injection | Savings |
|-------|--------|-----|-----------|---------|
| **Explore** | `explore-codebase` agent | 24h | `SubagentStart` → explore-codebase | ~85% |
| **Documentation** | Context7/Exa synthesis | 7d | `SubagentStart` → research-expert | ~90% |
| **Lessons** | Sniper Edit corrections | 30d | `SubagentStart` → all agents/sniper | ~50-70% |
| **Tests** | Sniper test results | 48h | `SubagentStart` → sniper | ~60% |

### Cache Scripts

The plugin ships no scripts anymore (removed 2026-09-19). All cache/APEX hook
behavior (explore/doc/lessons/test caches, APEX phase enforcement, analytics)
is provided by the harness `aipilot` scope in `@fusengine/harness`, invoked
from `hooks/hooks.json` via `hook codex aipilot`.

### Lessons Format (per-timestamp)

Each sniper run creates a `{timestamp}.json` with Edit-extracted corrections:

```json
{
  "project": "/path/to/project",
  "timestamp": "2026-02-09T01:14:44",
  "errors": [
    {"error_type":"missing_directive","pattern":"Component using hooks without 'use client'","fix":"Fix missing_directive in Dashboard.tsx","count":1,"files":["/path/Dashboard.tsx"],"code":{"line":["'use client'","","import React from 'react'"]}}
  ]
}
```

## Hooks (11 entries)

All entries invoke the same command, `hook codex aipilot`, routed to the
harness `aipilot` scope — no plugin-local script per hook.

| Hook Type | Count | Matchers |
|-----------|-------|----------|
| UserPromptSubmit | 1 | (none) |
| SubagentStart | 1 | (none) |
| PreToolUse | 3 | `Bash`, `apply_patch`, `spawn_agent\|multi_agent_v1.spawn_agent` |
| SubagentStop | 1 | (none) |
| PostToolUse | 3 | `apply_patch`, `context7\|exa\|Bash`, `update_plan` |
| Stop | 1 | (none) |
| SessionEnd | 1 | (none) |

## MCP Servers

- Context7 (documentation)
- Exa (web search, code context)
- Sequential Thinking (complex reasoning)
