---
name: prompt
description: "Create, optimize, review, or design prompts and agent instructions using prompt-engineering best practices."
---

# Prompt Workflow

Use this skill when the user asks to create, optimize, review, or design prompts.

## Usage

Infer the action from the user's request. If the action is ambiguous, ask one
concise clarifying question.

## Actions

| Action | Description |
|--------|-------------|
| `create` | Create a new prompt |
| `optimize` | Improve an existing prompt |
| `agent` | Design a complete agent |
| `review` | Analyze an existing prompt |

## Workflow

### 1. Action Detection

```text
IF the request contains "create" or "new":
  → Action: CREATE
IF the request contains "optimize" or "improve":
  → Action: OPTIMIZE
IF the request contains "agent" or "assistant":
  → Action: AGENT_DESIGN
IF the request contains "review" or "analyze":
  → Action: REVIEW
ELSE:
  → Ask for clarification
```

### 2. Skill Selection

```text
Load the appropriate prompt-engineer skill:
- prompt-creation
- prompt-optimization
- agent-design
- guardrails
- prompt-testing
```

### 3. Workflow Execution

**For CREATE:**
1. Identify prompt type (system, task, few-shot, meta)
2. Identify constraints (model, format, domain)
3. Apply the structured 9-element structure
4. Generate prompt with appropriate techniques
5. Validate with quality checklist

**For OPTIMIZE:**
1. Analyze current prompt
2. Identify issues (clarity, structure, completeness, guardrails)
3. Apply corrections
4. Generate before/after report
5. Propose optimized prompt

**For AGENT_DESIGN:**
1. Define identity and purpose
2. Choose architecture pattern
3. Define workflow
4. Configure tools and skills
5. Implement guardrails
6. Generate a Codex-compatible agent TOML or skill, depending on the target

**For REVIEW:**
1. Analyze according to checklist
2. Score each criterion (clarity, structure, completeness, guardrails)
3. Identify strengths and weaknesses
4. Propose recommendations

## Examples

### Create a system prompt

Create a technical support assistant for a mobile app.

### Optimize an existing prompt

Optimize the prompt pasted by the user.

### Design an agent

Design a Python-specialized code reviewer agent.

### Analyze a prompt

Review the prompt pasted by the user.

## Output Format

### For CREATE/OPTIMIZE

```markdown
# [Prompt Name]

## Objective
[Description]

## Prompt

---
[THE COMPLETE PROMPT]
---

## Techniques Used
- [Technique 1]: [Why]
- [Technique 2]: [Why]

## Usage Notes
- [Note 1]
- [Note 2]
```

### For AGENT_DESIGN

```markdown
# Agent: [Name]

## Generated File

---
[CONTENT OF agent.md FILE]
---

## Architecture
- Pattern: [pattern used]
- Tools: [list of tools]
- Skills: [associated skills]

## Installation Instructions
1. [Step 1]
2. [Step 2]
```

### For REVIEW

```markdown
# Prompt Analysis

## Scores
| Criterion | Score | Comment |
|-----------|-------|---------|
| Clarity | X/10 | [...] |
| Structure | X/10 | [...] |
| Completeness | X/10 | [...] |
| Guardrails | X/10 | [...] |

## Strengths
- [Point 1]
- [Point 2]

## Areas for Improvement
1. [Area 1]: [Recommendation]
2. [Area 2]: [Recommendation]
```
