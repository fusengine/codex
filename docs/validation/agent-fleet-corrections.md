# Agent Fleet Correction Coverage

This inventory records the audited intent for all 37 agent prompt TOMLs in the source repository. It follows the authority, DRY, research, APEX, and acceptance rules in [`AGENTS.md`](../../AGENTS.md). The full APEX phase navigation remains documented in [`plugins/ai-pilot/skills/apex-methodology/SKILL.md`](../../plugins/ai-pilot/skills/apex-methodology/SKILL.md).

The working tree contains prompt corrections for 31 agents: 10 agents first changed in earlier lots, including `security-expert`, and 21 additional agents changed in the current fleet lot. The six remaining prompts had no measured contradiction requiring an edit. This is a prompt-source inventory, not a claim that all 218 skills were audited or that every correction passed behavioral evaluation.

The table and validation snapshot below are historical: they predate the fresh-research, redispatch, and local-development security corrections completed on 2026-09-07.

## Current superseding state — 2026-09-07

- Documentation must be consulted fresh for each mandate through fuse-browser, Context7, and Exa; cached or reused research does not substitute for current consultation.
- The canonical redispatch guard is restored: verify delivered work and its evidence instead of executing it twice, while allowing materially new or corrected mandates.
- `security-expert` now uses Sol/medium and limits active, non-destructive checks to verified local development targets. Its five security-audit skills plus fuse-browser remain enabled. This is a prompt and model-policy correction, not a medium-effort behavioral benchmark or network-enforcement claim; the historical pilot failure remains unchanged.
- Final scoped challenger and sniper reviews passed. The full suite passed with 293 tests, 1 pre-existing skip, 0 failures, and 1585 assertions across 58 files; `tsc --noEmit`, `bun run validate`, and `git diff --check` also passed.

| Agent | Lot | Status | Correction or no-change rationale |
| --- | --- | --- | --- |
| astro-expert | Earlier | Applied; static checks pass | Reuses lead evidence, avoids nested review delegation, restores the canonical research and acceptance gates, removes the obsolete file cap, and keeps optional UI tooling optional. |
| brainstorming | Current | Applied; static checks pass | Uses proportional alternatives, preserves prior owner authorization, returns the design to the lead from its read-only sandbox, and avoids duplicate research. |
| cartographer | Current | Applied; static checks pass | Resolves scope from the mandate before asking, keeps source editing outside its role, and reports measured map coverage. |
| challenger | Earlier + alignment | Applied; static checks pass | Preserves fresh-context consultative review and aligns its source chain with fuse-browser → Context7 → Exa → repository evidence. |
| changelog-watcher | Current | Applied; static checks pass | Returns the proposed last-checked state to the lead instead of claiming a write from a read-only agent. |
| commit | Current | Applied; static checks pass | Makes every Git stage authority-bound, removes protected-branch exceptions and policy-block adaptation, preserves M2/CI/merge checks, and permits tags only after a proven merge. |
| commit-detector | Current | Applied; static checks pass | Analyzes staged changes for a commit proposal and removes an inapplicable execution-confirmation rule from this non-executing detector. |
| design-expert | Current | Applied; static checks pass | Reuses current lead evidence, keeps design-specific work bounded, and returns local evidence for lead-coordinated acceptance. |
| explore-codebase | Earlier | Applied; static checks pass | Expands repository evidence to callers, reuse candidates, conventions, and checks without arbitrary tool-count quotas. |
| go-expert | Current | Applied; static checks pass | Reuses lead analysis, removes nested delegation and the obsolete file cap, researches only evidence gaps, and returns Go checks to the lead. |
| laravel-expert | Current | Applied; static checks pass | Reuses lead evidence, preserves Laravel capabilities, removes duplicate agent orchestration and the obsolete file cap, and returns framework checks for acceptance. |
| lessons-compactor | Unchanged | No edit | Its narrow proposal-only memory-compaction role showed no measured authority, scope, or tool contradiction in this audit. |
| nextjs-expert | Current | Applied; static checks pass | Reuses lead evidence, preserves Next.js capabilities and the project's existing authentication stack, removes duplicate agent orchestration and the obsolete file cap, and returns framework checks for acceptance. |
| php-expert | Current | Applied; static checks pass | Reuses lead analysis, removes nested delegation and the obsolete file cap, researches only evidence gaps, and returns PHP checks to the lead. |
| prompt-engineer | Current | Applied; static checks pass | Replaces stale provider/year assumptions and hidden chain-of-thought requests with current, target-model-aware structure and concise rationale evidence. |
| react-expert | Earlier | Applied; static checks pass | Reuses lead evidence, avoids nested reviewers, applies the canonical file ceiling, and treats shadcn/Gemini as optional accelerators. |
| research-expert | Earlier | Applied; static checks pass | Uses fuse-browser first, then Context7 and Exa, with dated version/applicability evidence and explicit unresolved gaps. |
| rust-expert | Current | Applied; static checks pass | Reuses lead analysis, removes nested delegation and the obsolete file cap, researches only evidence gaps, and returns Rust checks to the lead. |
| security-expert | Earlier | Applied earlier; behavioral pilot failed; unchanged this turn | Keeps read-only audit authority, evidence-based confirmed/provisional/dismissed/unresolved triage, honest sources, and six skills. The bounded completion pilot failed, so no behavioral acceptance is claimed and no rollback was applied. |
| seo-cluster | Unchanged | No edit | Its bounded keyword-clustering role showed no measured authority, scope, or tool contradiction in this audit. |
| seo-content | Unchanged | No edit | Its content evidence and scoring role showed no measured contradiction requiring a prompt edit in this audit. |
| seo-expert | Current | Applied; static checks pass | Replaces universal SEO/GEO weights, zero-click percentages, and mandatory platform claims with task-specific sourced evidence and explicit untested coverage. |
| seo-geo | Current | Applied; static checks pass | Uses fuse-browser fast-path tools for static content and opens a live session only when interaction, rendering, or pixels require it. |
| seo-images | Unchanged | No edit | Its image-audit scope showed no measured authority, scope, or tool contradiction in this audit. |
| seo-local | Current | Applied; static checks pass | Replaces the arbitrary 50-page hard stop with bounded batches and explicit checked and remaining coverage. |
| seo-schema | Unchanged | No edit | Its schema validation scope showed no measured authority, scope, or tool contradiction in this audit. |
| seo-sitemap | Current | Applied; static checks pass | Restores explicit sitemap or robots generation as complete returned content without filesystem mutation. |
| seo-technical | Unchanged | No edit | Its technical SEO audit scope showed no measured authority, scope, or tool contradiction in this audit. |
| shadcn-ui-expert | Earlier | Applied; static checks pass | Keeps registry-first behavior, adds a configured-skill fallback, aligns the research chain, and stops before unresolved API edits. |
| sniper | Earlier + alignment | Applied; static checks pass | Keeps specialized code review while returning evidence to the lead, aligns research fallback and retry behavior, describes `sniper-faster` by bounded mechanical scope rather than line count, and leaves final acceptance with the lead. |
| sniper-faster | Current | Applied; static checks pass | Routes pre-identified fixes by diagnostic complexity instead of a 10-line cap and returns only changed files plus check evidence. |
| solid-orchestrator | Earlier | Applied; static checks pass | Uses only `FUSE_SOLID_MAX_LINES`, restores language-specific SOLID routes, and applies the shared DRY rule. |
| swift-expert | Current | Applied; static checks pass | Reuses lead evidence, preserves Apple-platform capabilities, keeps MCP, CLI, and documentation tooling optional with explicit fallbacks, removes duplicate orchestration and the obsolete file cap, and returns Swift checks for acceptance. |
| tailwindcss-expert | Current | Applied; static checks pass | Reuses lead evidence, preserves Tailwind capabilities, removes duplicate agent orchestration, and returns style/build checks for acceptance. |
| tanstack-start-expert | Current | Applied; static checks pass | Reuses lead evidence, preserves TanStack Start capabilities, removes duplicate orchestration and the obsolete file cap, and returns framework checks for acceptance. |
| typescript-expert | Current | Applied; static checks pass | Reuses lead analysis, removes nested delegation and the obsolete file cap, researches only evidence gaps, and returns TypeScript checks to the lead. |
| websearch | Earlier | Applied; static checks pass | Uses fuse-browser first and Exa for cross-checking, removes obsolete tool namespaces and arbitrary call limits, and routes uncertain API/version or deep research to `research-expert`. |

## Historical validation state

- Inventory: 37 agent TOMLs; 31 modified prompt sources and 6 unchanged prompts.
- Full suite: 293 pass, 1 pre-existing skip, 0 fail, 1582 assertions across 58 files.
- Additional checks: `tsc --noEmit`, `bun run validate`, and `git diff --check` passed; eLicit and Verify challengers returned `CONFIRMED`.
- Final scoped sniper: no source defect found; documentation recheck pending this update.
- Security behavioral evidence: failed bounded completion pilot; see [`security-agent-pilot.md`](security-agent-pilot.md).
