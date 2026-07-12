---
name: step-00-init
description: Initialize elicitation context, detect execution mode, load expert context
prev_step: null
next_step: steps/step-01-analyze-code.md
---

# Step 0: Initialize Elicitation

## MANDATORY EXECUTION RULES:

- 🔴 NEVER skip this step
- ✅ ALWAYS detect execution mode first
- ✅ ALWAYS load expert context from Execute phase
- 🔍 FOCUS on understanding what was coded

---

## Context Boundaries

**Input from Execute phase:**
- Files created/modified
- Code type (auth, API, UI, etc.)
- Framework used
- Expert agent that coded

**Output for next steps:**
- `{elicit_mode}`: manual | auto | skip
- `{code_files}`: list of modified files
- `{code_type}`: detected code category
- `{expert_agent}`: which expert coded

---

## YOUR TASK:

### 1. Detect Execution Mode

```
Check arguments:
- --auto   → {elicit_mode} = "auto"
- --manual → {elicit_mode} = "manual"
- --skip   → {elicit_mode} = "skip"
- (none)   → {elicit_mode} = "manual" (default)
```

### 2. Load Execute Context

```
Gather from previous phase:
- Which files were created/modified
- What type of code was written
- Which expert agent performed the work
- What framework/language was used
```

### 3. Load Prior Artifact

```
Derive {task-slug} using references/artifact-contract.md.
IF .codex/apex/docs/elicit-{task-slug}.json exists:
  → Load it as {prior_artifact}
  → Deselect prior pass techniques by default
  → Prioritize fail/deferred techniques
ELSE:
  → {prior_artifact} = none
```

### 4. Validate Context

```
Required for next steps:
✓ At least 1 file modified
✓ Code type identifiable
✓ Expert agent known
```

### 5. Handle Skip Mode

```
IF {elicit_mode} == "skip":
  → Output: "Elicitation skipped. Proceeding to sniper validation."
  → END (do not continue to step 1)
```

---

## Output Format

```markdown
## 🟣 Elicitation Initialized

**Mode**: {elicit_mode}
**Expert**: {expert_agent}
**Code Type**: {code_type}
**Files to Review**:
- {file_1}
- {file_2}

→ Proceeding to Step 1: Analyze Code
```

---

## Next Step

→ `step-01-analyze-code.md`: Deep analysis of written code
