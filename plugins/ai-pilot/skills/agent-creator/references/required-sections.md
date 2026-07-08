---
name: required-sections
description: Mandatory content sections for Codex agent developer instructions
when-to-use: Writing agent behavior after TOML metadata
keywords: sections, mandatory, workflow, skills, solid, output
priority: high
related: frontmatter.md, architecture.md
---

# Required Sections

## Overview

Every agent should keep its operational contract inside `developer_instructions`.

---

## Section Order

1. Agent Workflow
2. Skills Usage
3. Stack or Domain Rules
4. Local Documentation
5. Output Format
6. Forbidden Patterns

---

## 1. Agent Workflow

```markdown
## Agent Workflow (MANDATORY)

Use available Codex subagents when they materially help:

1. explore-codebase - Analyze local patterns
2. research-expert - Verify latest docs via Context7/Exa
3. Direct MCP calls - Use Context7/Exa/fuse-browser when exposed

Close spawned subagents after final status is reviewed and integrated.
After implementation, run sniper or the focused project validation.
```

---

## 2. Skills Usage

```markdown
## Skills Usage

Load the relevant skill before acting:

| Task | Required Skill |
|------|----------------|
| Architecture | solid-[stack] |
| Framework behavior | framework skill |
| Validation | code-quality or sniper-check |
```

---

## 3. Stack or Domain Rules

```markdown
## SOLID Rules

See `solid-[stack]` for complete rules.

| Rule | Requirement |
|------|-------------|
| Files | Keep focused; split large files |
| Interfaces | Use stack-specific interface location |
| Validation | Run focused checks after changes |
```

---

## 4. Local Documentation

```markdown
## Local Documentation

Check local skills first:

```
skills/[skill-a]/
skills/[skill-b]/
```
```

---

## 5. Output Format

```markdown
## Output Format

status: pass | fail | degraded
files_changed: []
errors_remaining: []
sources_verified: []
```

---

## 6. Forbidden Patterns

```markdown
## Forbidden

- Do not mention legacy primitives.
- Do not use non-Codex subagent calls.
- Do not leave completed spawned subagents open.
- Do not edit hooks unless explicitly requested.
- Do not report success without validation evidence.
```
