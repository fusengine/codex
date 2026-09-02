---
name: hooks
description: Plugin-level hooks.json — not agent frontmatter
when-to-use: Configuring automatic hook behavior for a plugin's agents
keywords: hooks, pretooluse, posttooluse, harness, hooks.json
priority: medium
related: frontmatter.md, architecture.md
---

# Plugin Hooks

## Overview

Hooks are **not** part of an agent's TOML. They live one level up, in the
plugin's `hooks/hooks.json`, and apply to every agent (and the session) in
that plugin — see [architecture.md](architecture.md) for where the file sits.

Every hook command shipped in this repo routes through the shared Harness
CLI:

```
~/.codex/config.toml
       |
       v
plugins/<plugin>/hooks/hooks.json
       |
       v
@fusengine/harness hook codex <scope>
```

There is no per-plugin custom validation script wired into a hook — see
"No Custom Scripts" below before reaching for one.

---

## `hooks.json` Format

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "apply_patch",
        "hooks": [
          {
            "type": "command",
            "command": "bun \"${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs\" hook codex core"
          }
        ]
      }
    ]
  }
}
```

- Top level: one array per hook event name.
- Each array entry: a `matcher` (tool/call name, regex, or `""` for "always")
  plus a `hooks` array.
- Each inner hook object: `type` (always `"command"`), `command`, and two
  optional keys — `additionalContextLimit` (caps injected context size, e.g.
  `6000`) and `timeout` (seconds, e.g. `3`).

Real references: `plugins/typescript-expert/hooks/hooks.json`,
`plugins/ai-pilot/hooks/hooks.json`, `plugins/codex-rules/hooks/hooks.json`
(the last one exercises `additionalContextLimit`).

---

## Hook Events (this repo)

| Event | When | Purpose |
|-------|------|---------|
| `SessionStart` | Session starts | Load context, cleanup state |
| `UserPromptSubmit` | User sends a message | Detect project type, inject guidance |
| `PreToolUse` | Before tool execution | Block unsafe or invalid actions |
| `PostToolUse` | After tool execution | Validate results, track changes |
| `SubagentStart` | A sub-agent starts | Inject rules/context into that agent |
| `SubagentStop` | A sub-agent finishes | Cleanup, notification |
| `Stop` | Turn finishes | Cleanup, completion notification |
| `SessionEnd` | Session ends | Final cleanup |

Do not register `PreCompact` until Codex stabilizes it. Full authoritative
list and Harness-runtime caveats: `docs/reference/hooks.md`.

---

## Matcher Patterns

Matchers target Codex tool/call names, not file globs:

| Pattern | Matches |
|---------|---------|
| `""` | Every call for that event |
| `apply_patch` | The patch/edit tool only |
| `Bash` | Shell execution |
| `spawn_agent\|multi_agent_v1.spawn_agent` | Either spawn call |
| `context7\|exa\|Bash` | Any of the three |

---

## Environment Variables

| Variable | Value |
|----------|-------|
| `${CODEX_HOME:-$HOME/.codex}` | Root Codex config/install dir — every hook command in this repo resolves the harness binary from here |
| `${PLUGIN_ROOT}` | A skill/plugin's own directory — used inside skill content and `[[skills.config]]` paths, not inside the hook commands themselves in this repo |

---

## No Custom Scripts

Earlier drafts of this reference assumed each plugin ships its own
`scripts/validate-<stack>.sh`, invoked directly by a hook with a file path
argument, doing its own line-count/interface-location checks. That is not how
Codex hooks work here: every shipped `hooks.json` in this repo calls the same
Harness CLI (`hook codex <scope>`), and `docs/reference/hooks.md` explicitly
says not to wire a new direct script — port the behavior into Harness first,
with parity tests. If a plugin's `scripts/` directory still holds a
validation script, treat it as a migration artifact, not something hook
config invokes.

Any script-level examples in
[templates/hook-scripts.md](templates/hook-scripts.md) should be read as
implementation notes for the Harness route a plugin registers under
(`hook codex <scope>`), not as standalone scripts a plugin can wire on its
own. The same applies to
[templates/hook-scripts-reference.md](templates/hook-scripts-reference.md)
and
[templates/hook-scripts-reference-2.md](templates/hook-scripts-reference-2.md):
both hold Claude-era check logic (positional `$1`, `exit 1`) that must be
ported to the `.native.ts` stdin-JSON / `permissionDecision` contract, never
wired as-is (see `hook-scripts.md:44`).

---

## Adding Hooks To A Plugin

1. Create `plugins/<plugin>/hooks/hooks.json`.
2. Register only an event/matcher tuple that has a real Harness route — an
   unregistered tuple is rejected by validation, not silently ignored.
3. Validate: `bun run validate` (exhaustive Harness route gate).

---

## Best Practices

| DO | DON'T |
|----|-------|
| Reuse the existing `hook codex <scope>` command for your plugin's scope | Invent a new direct script the hook calls itself |
| Keep `matcher` as narrow as the intent requires | Match `""` when a specific tool/call is meant |
| Use `timeout` / `additionalContextLimit` when a hook is slow or verbose | Let a hook block indefinitely or flood context |
| Exit 0 for "allow" | Teach or expect legacy stderr / `exit 2` semantics |
