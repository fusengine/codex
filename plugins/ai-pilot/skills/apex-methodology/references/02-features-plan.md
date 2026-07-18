---
name: 02-features-plan
description: Create detailed implementation plan (APEX Phase P)
prev_step: references/01-analyze-code.md
next_step: references/03-execution.md
---

# 02 - Features Plan

**Create detailed implementation plan (APEX Phase P).**

## When to Use

- After code analysis complete
- Before writing any code
- When scope is understood

---

## Plan Creation (update_plan)

### Create Task Breakdown

```text
Call the `update_plan` tool with:
- plan (required): the ordered array of items, each item EXACTLY { step, status } where
  status is "pending" | "in_progress" | "completed" (no id, no priority — those 2 keys only)
- explanation (optional): a short note on the plan or the change you just made

Content of each step:
1. Ordered list of implementation steps
2. Each step <100 lines of code
3. Clear acceptance criteria
4. Dependencies between steps (note them in the step text)
```

`update_plan` REPLACES the whole plan on every call — always resend the FULL array with
the updated statuses (there is no per-item merge, no separate read tool: the current plan
is whatever you last sent). Usage rules: at most ONE item `in_progress` at a time; never
jump a step from `pending` straight to `completed` (set it `in_progress` first); no
batch-completing several steps at once; end the turn with every item `completed` (or the
plan explicitly abandoned). Skip `update_plan` entirely for a trivial single-step task.

### Task Structure

```markdown
## Implementation Plan

### Task 1: [Create interfaces/types]
- File: [interfaces location]/feature.[ext]
- Lines: ~30
- Dependencies: None

### Task 2: [Create utility functions]
- File: [utils location]/feature-utils.[ext]
- Lines: ~50
- Dependencies: Task 1

### Task 3: [Implement main logic]
- File: [main location]/Feature.[ext]
- Lines: ~80
- Dependencies: Task 1, 2
```

---

## File Size Planning

### Size Estimation Rules

| Estimated Lines | Action |
| --- | --- |
| < 50 | Single file OK |
| 50-80 | Monitor during implementation |
| 80-100 | Plan split points NOW |
| > 100 | MUST split before starting |

### Split Strategy

```text
Large feature → Split into:
├── main.[ext] (orchestration, <80 lines)
├── types.[ext] (interfaces, types)
├── validators.[ext] (validation logic)
├── utils.[ext] (helper functions)
└── constants.[ext] (config, constants)
```

---

## Interface-First Design

### Create Interfaces FIRST

Define contracts before implementation:

```text
1. Input/Output types
2. Configuration types
3. State shapes
4. API contracts
```

### Location Rules (Language-Specific)

| Language | Interface Location |
| --- | --- |
| TypeScript/JS | `src/interfaces/` or `src/types/` |
| PHP/Laravel | `app/Contracts/` |
| Swift | `Sources/Protocols/` |
| Go | Same package or `internal/` |
| Python | `interfaces/` module |

```text
✅ Centralized interface location
❌ NEVER in component/implementation files
❌ NEVER inline in implementation
```

---

## Dependency Mapping

### Identify Order

```text
1. Interfaces/Types (no dependencies)
2. Constants/Config (no dependencies)
3. Utilities (depends on types)
4. Business logic (depends on types, utils)
5. UI/Controllers (depends on all above)
6. Tests (depends on implementation)
```

### Dependency Graph

```text
interfaces/types
    ↓
constants
    ↓
utils ←→ validators
    ↓
business logic
    ↓
UI/Controllers
    ↓
tests
```

---

## Risk Assessment

### Identify Risks

```text
□ Complex logic requiring >100 lines?
   → Plan split NOW

□ Multiple external dependencies?
   → Verify compatibility

□ Existing code modifications?
   → Document current behavior

□ Database/API changes?
   → Plan migration

□ Breaking changes?
   → Document upgrade path
```

---

## Plan Template

```markdown
# Feature: [Name]

## Overview
[1-2 sentence description]

## Analysis Summary
- Patterns: [from 01-analyze]
- APIs: [verified methods]

## Tasks

### 1. Interfaces (~20 lines)
- [ ] Create [interfaces location]/feature.[ext]

### 2. Utilities (~40 lines)
- [ ] Create [utils location]/feature-utils.[ext]

### 3. Main Logic (~70 lines)
- [ ] Create [main location]/Feature.[ext]

### 4. Tests (~50 lines)
- [ ] Create [tests location]/feature.test.[ext]

## File Structure
[project structure visualization]

## Risks
- [identified risks]

## Estimated Total: ~180 lines (4 files)
```

---

## Validation Checklist

```text
□ update_plan plan created
□ All tasks <100 lines each
□ Interfaces planned FIRST
□ File splits pre-planned
□ Dependencies mapped
□ Risks identified
□ Total scope reasonable
```

---

## Update Task Phase

At the **start** of this phase, record it in `.codex/apex/task.json`:

```bash
jq --arg p "features-plan" '.tasks[.current_task].phase = $p' .codex/apex/task.json \
  > .codex/apex/task.json.tmp && mv .codex/apex/task.json.tmp .codex/apex/task.json
```

---

## Next Phase

→ Proceed to `03-execution.md`
