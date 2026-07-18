---
name: pr-summary
description: Summarize current pull request with diff, comments, and changed files. Use when reviewing PRs or before merging.
---

Runs in a forked subagent context (spawn_agent) via the `explore-codebase` agent. The PR number is passed as the skill argument.

# PR Summary Skill

Summarize the current pull request.

## Pull Request Context

Gather the context by running:

- **PR diff:** `gh pr diff`
- **PR comments:** `gh pr view --comments`
- **Changed files:** `gh pr diff --name-only`
- **PR status:** `gh pr status`

## Task

Analyze this pull request and provide:

1. **Overview** - What does this PR do?
2. **Key Changes** - Main files and modifications
3. **Potential Risks** - Breaking changes, security concerns
4. **Review Recommendations** - What to check carefully

## Output Format

```markdown
## PR Summary: [Title]

### Overview
[1-2 sentences]

### Key Changes
- [file]: [change description]
- ...

### Risks
- [risk if any]

### Recommendations
- [what to verify]
```

## Debug

- Session: the current session id
- Timestamp: run `date +%Y-%m-%d_%H:%M:%S`
