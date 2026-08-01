---
name: commit-optimization
description: Use when configuring settings.json to reduce commit-pro's context token usage.
---

<objective>
Documents the `includeGitInstructions: false` settings.json option (and its `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS=1` env var override, which takes precedence) that removes Codex's built-in commit/PR workflow instructions from the system prompt — saving 2-5% context tokens — since commit-pro supplies its own comprehensive git workflow that supersedes the defaults.
</objective>

# Commit Optimization

## Optimization: Disable Built-in Git Instructions

For best results with commit-pro, add this to your `~/.codex/settings.json`:

```json
{
  "includeGitInstructions": false
}
```

This removes Codex's built-in commit/PR workflow instructions from the system prompt, saving 2-5% context tokens. commit-pro provides its own comprehensive git workflow that supersedes the defaults.

Note: `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS=1` env var takes precedence over this setting.
