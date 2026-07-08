---
name: commit-optimization
description: "Optimize the commit-pro workflow for Codex. Use when reducing commit workflow overhead, avoiding duplicate git guidance, or migrating commit settings from another agent runtime."
related-skills: commit, commit-detection, git-flow, post-commit
---

# Commit Optimization

## Codex Guidance

Codex has no verified equivalent to external-agent git-instruction toggles such as `includeGitInstructions`. Do not add unsupported runtime settings to Codex config.

## Recommended Usage

Use the narrowest commit-pro skill for the current task:

| Need | Skill |
|------|-------|
| Detect commit type only | `commit-detection` or `commit-detector` agent |
| Full commit workflow | `commit` |
| Known type | `feat`, `fix`, `docs`, `test`, `chore`, `refactor` |
| CHANGELOG/version bump after commit | `post-commit` |

Keep the detector read-only. Run mutating git operations only after explicit user confirmation and repository policy checks.
