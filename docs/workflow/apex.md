# APEX Methodology

**A**nalyze -> **P**lan -> **E**xecute -> e**L**icit -> e**X**amine

## Overview

APEX is mandatory for every task. It is a workflow, not a hard dependency on one
orchestration API. Use the Codex tools available in the current runtime.

```
Brainstorm -> required for new features, broad refactors, ambiguous decisions
Analyze    -> always required: local exploration, docs, optional agents
Plan       -> always required: concise tasks tied to files and checks
Execute    -> scoped edits or answer following project patterns
eLicit     -> required for non-trivial changes
Verify     -> always required: functional evidence
eXamine    -> required after code/config changes
```

## Phases

### A - Analyze

Always explore locally with `rg`, file reads, and project documentation. Use
subagents/research when the task is broad, risky, or benefits from parallel
work.

Typical inputs:
- `explore-codebase` for architecture mapping
- `research-expert` for official docs and best practices
- domain expert for framework-specific analysis

### P - Plan

Always create a short task list with:
- target files
- dependencies
- edge cases
- validation commands

### E - Execute

Implement with the relevant domain patterns:
- `nextjs-expert`, `laravel-expert`, `react-expert`, etc. when available
- SOLID and DRY rules from `skills/solid-*/`
- tests proportional to risk

### L - eLicit

Self-review before final validation:

| Mode | Flag | Description |
|------|------|-------------|
| Auto | `--auto` | Auto-select review techniques |
| Manual | `--manual` | User chooses techniques |
| Skip | `--skip-elicit` | Go directly to eXamine |

### Verify

Always verify the result. For read-only answers, cite the local files, commands,
or docs used as evidence. For changes, run functional checks.

### X - eXamine

Run the checks that prove the change:
1. Linters/formatters when configured
2. Typecheck for typed projects
3. Focused tests
4. Build or smoke test when user-facing behavior changed
5. Sniper/code-quality validation when available

## APEX Depth

**Full APEX for:**
- new feature, component, or file
- multi-file changes
- architecture modification
- refactoring or migration
- debugging unclear failures

**Quick APEX for:**
- questions and explanations
- trivial fixes
- read-only search/debug
- simple git inspection

Quick APEX still includes Analyze, Plan, Execute/Answer, and Verify. It may skip
Brainstorm and eLicit only when there is no ambiguity and no meaningful change
risk.

## Tracking

APEX state may be stored in `.codex/apex/`:

```
project/.codex/apex/
├── task.json
└── docs/
```
