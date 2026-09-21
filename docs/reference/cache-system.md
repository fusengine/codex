# Cache System (fusengine)

4-level persistent cache system that eliminates redundant operations across sessions.

## Overview

```
${CODEX_HOME:-~/.codex}/fusengine/
├── explore/{project-hash}/    # Architecture snapshots
├── doc/{project-hash}/        # Documentation cache
├── lessons/{project-hash}/    # Sniper error patterns
│   └── _global/{stack}.json   # Cross-project promoted lessons
├── tests/{project-hash}/      # Test results cache
└── analytics/
    └── sessions.jsonl         # Cache hit/miss tracking
```

Each project gets a unique hash (first 16 chars of SHA-256 of the project path).

## Token Savings

| Cache Level | Before | After | Savings |
|-------------|--------|-------|---------|
| Explore | ~15K tokens/scan | ~2K injected | ~85% |
| Documentation | ~10K tokens/query | ~1K summary | ~90% |
| Lessons | Repeated errors | Pre-warned | ~50-70% |
| Tests | Re-run all tests | Skip unchanged | ~60% |
| **Compound** | - | - | **60-75%** |

## Level 1: Explore Cache

**Purpose**: Cache architecture snapshots from `explore-codebase` agent.

| Property | Value |
|----------|-------|
| TTL | 24 hours |
| Location | `${CODEX_HOME:-~/.codex}/fusengine/explore/{hash}/` |
| Capture | `SubagentStart` (harness `aipilot` scope) |
| Format | `metadata.json` + `snapshot.md` |

**Flow**:
1. `explore-codebase` starts → `SubagentStart` fires the harness `aipilot` scope
2. If cache hit (< 24h old) → inject snapshot via `additionalContext`, agent skips scan
3. If cache miss → agent runs normally, saves result for next time

## Level 2: Documentation Cache

**Purpose**: Cache Context7/Exa documentation synthesis for `research-expert`.

| Property | Value |
|----------|-------|
| TTL | 7 days |
| Location | `${CODEX_HOME:-~/.codex}/fusengine/doc/{hash}/` |
| Capture | `SubagentStop` (harness `aipilot` scope) |
| Inject | `SubagentStart` (harness `aipilot` scope) |
| Format | `index.json` manifest + `docs/{doc-hash}.md` synthesis files |
| Limits | Max 15 docs, max 20KB/doc |

**Flow**:
1. `research-expert` starts → the harness `aipilot` scope injects cached doc summaries (soft guidance)
2. Agent queries Context7/Exa freely (no blocking gate)
3. When agent completes → the harness `aipilot` scope extracts full synthesis from transcript

**index.json**:
```json
{
  "project": "/path/to/project",
  "docs": [
    {
      "hash": "a1b2c3d4",
      "library": "/vercel/next.js",
      "topic": "app router server components",
      "timestamp": "2026-02-08T22:14:13",
      "size_kb": 8
    }
  ]
}
```

## Level 3: Lessons Cache

**Purpose**: Capture sniper Edit corrections as reusable error patterns.

| Property | Value |
|----------|-------|
| TTL | 30 days |
| Location | `${CODEX_HOME:-~/.codex}/fusengine/lessons/{hash}/` |
| Capture | `SubagentStop` (harness `aipilot` scope) |
| Inject | `SubagentStart` (harness `aipilot` scope) → ALL agents |
| Promotion | harness `aipilot` scope, background → `_global/{stack}.json` (3+ occurrences) |
| Format | Per-timestamp JSON files (`{timestamp}.json`) |
| Limits | Auto-cleanup files > 30 days, top 10 injected |

**Flow**:
1. Sniper finishes with `SubagentStop` → the harness `aipilot` scope runs
2. It reads `agent_transcript_path` (JSONL)
3. Extracts all Edit tool_use entries (file, old_string, new_string)
4. Categorizes errors by code diff analysis (missing_directive, type_any, etc.)
5. Saves as `{timestamp}.json` with one error per line
6. Runs the promotion step in background (promotes errors seen 3+ times to `_global/`)
7. Next agent start → `SubagentStart` aggregates local + global lessons, injects top 10

**Lesson file format** (`2026-02-09T01-14-44.json`):
```json
{
  "project": "/path/to/project",
  "timestamp": "2026-02-09T01:14:44",
  "errors": [
    {"error_type":"missing_directive","pattern":"Component using hooks without 'use client'","fix":"Fix missing_directive in Dashboard.tsx","count":1,"files":["/path/Dashboard.tsx"],"code":{"line":["'use client'","","import React from 'react'"]}},
    {"error_type":"missing_display_name","pattern":"Code correction in StatsView.tsx","fix":"Fix missing_display_name in StatsView.tsx","count":1,"files":["/path/StatsView.tsx"],"code":{"line":["StatsView.displayName = 'StatsView'"]}}
  ]
}
```

**Error categories** (auto-detected from code diff):

| Category | Detection Pattern |
|----------|-------------------|
| `type_any` | old_string contains `any` |
| `missing_directive` | new_string contains `use client` |
| `missing_display_name` | new_string contains `displayName` |
| `missing_a11y` | new_string contains `onKeyDown\|tabIndex\|role=` |
| `missing_error_handling` | new_string contains `try\|catch` |
| `null_safety` | new_string contains `if.*null\|??` |
| `code_fix` | Default fallback |

## Level 4: Tests Cache

**Purpose**: Cache test results from sniper validation runs.

| Property | Value |
|----------|-------|
| TTL | 48 hours |
| Location | `${CODEX_HOME:-~/.codex}/fusengine/tests/{hash}/` |
| Capture | `SubagentStop` (harness `aipilot` scope) |
| Inject | `SubagentStart` (harness `aipilot` scope) → sniper |
| Format | `results.json` with file checksums |

**Flow**:
1. Sniper completes → the harness `aipilot` scope saves test results with file hashes
2. Next sniper start → the harness `aipilot` scope injects previous results
3. Sniper can skip re-testing unchanged files

## Analytics

**Purpose**: Track cache hit/miss rates across sessions.

| Property | Value |
|----------|-------|
| Location | `${CODEX_HOME:-~/.codex}/fusengine/analytics/` |
| Capture | `Stop` (harness `aipilot` scope) |
| Format | `sessions.jsonl` (one event per line) |

**Event format**:
```json
{"ts":"2026-02-10T15:42:36","session":"1770738156","type":"explore","action":"hit","project_hash":"caad47f308f6a24d"}
```

## Injection Format

When agents start, the harness `aipilot` scope outputs:

```
## KNOWN PROJECT ISSUES (from previous sniper validations)
These errors have been found and fixed before. AVOID them:
1. [5x] Missing 'use client' on components using hooks → Add directive
     Code: 'use client' | import React from 'react'
2. [3x] Import from '../' instead of '@/modules/' → Use alias
3. [2x] displayName missing → Add Component.displayName

INSTRUCTION: Check your code against these known issues BEFORE submitting.
```

## Scripts Reference

`plugins/ai-pilot/scripts/` ships no scripts anymore (removed 2026-09-19,
along with the orphaned `lib/` tier below it). Every cache capture/inject
path described above (explore, doc, lessons, tests, analytics) is implemented
by the harness `aipilot` scope in `@fusengine/harness`; `hooks/hooks.json`
invokes it uniformly via `hook codex aipilot` for every hook type, with no
plugin-local script per hook.

## Shared Library (`lib/`)

`plugins/ai-pilot/scripts/lib/` no longer exists — the cache/APEX helper
modules it used to hold (`core.ts`, `json.ts`, `analytics.ts`,
`cache/project-detect.ts`, `cache/lesson-helpers.ts`,
`cache/lesson-aggregator.ts`, `cache/source-collector.ts`,
`apex/detection.ts`, `apex/state.ts`, `apex/enforce-helpers.ts`, and the
`interfaces/` types) were dead code by the time they were removed: `hooks.json`
already routed every hook to the harness `aipilot` scope, so this logic now
lives in `@fusengine/harness` (`src/runtime/lifecycle/**`), not in this repo.

## Troubleshooting

### Check cache contents
```bash
# List cached lessons for current project
ls ${CODEX_HOME:-~/.codex}/fusengine/lessons/

# View latest lesson file
cat ${CODEX_HOME:-~/.codex}/fusengine/lessons/*/$(ls -t ${CODEX_HOME:-~/.codex}/fusengine/lessons/*/ | head -1)

# Check doc cache index
cat ${CODEX_HOME:-~/.codex}/fusengine/doc/*/index.json | jq .

# View analytics
cat ${CODEX_HOME:-~/.codex}/fusengine/analytics/sessions.jsonl
```

### Clear cache
```bash
# Clear all caches
rm -rf ${CODEX_HOME:-~/.codex}/fusengine/

# Clear only lessons
rm -rf ${CODEX_HOME:-~/.codex}/fusengine/lessons/

# Clear only doc cache
rm -rf ${CODEX_HOME:-~/.codex}/fusengine/doc/

# Clear only tests cache
rm -rf ${CODEX_HOME:-~/.codex}/fusengine/tests/
```
