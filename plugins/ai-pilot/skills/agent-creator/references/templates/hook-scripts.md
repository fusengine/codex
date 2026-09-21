---
name: hook-scripts
description: Real Codex/Harness hook attach point — how plugin hooks are wired end-to-end
keywords: hooks, harness, hooks.json, routes, scopes, validate, trust
---

# Hook Scripts — Attach Point

## Usage

In this Codex marketplace, `plugins/<plugin>/hooks/hooks.json` NEVER invokes a hand-written
script. Every entry calls the canonical Harness CLI route for its `(plugin, event, matcher)`
tuple. There is no plugin-local hook-script layer in this repo — see **Forbidden** below for
what that used to look like and why it's gone.

---

## (a) `hooks.json` — canonical command only

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "apply_patch",
        "hooks": [
          { "type": "command", "command": "bun \"${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs\" hook codex core" }
        ]
      }
    ]
  }
}
```

(Real example: `plugins/typescript-expert/hooks/hooks.json` — `PreToolUse`/`apply_patch` and
`PostToolUse`/`""`, both scope `core`.) One entry per `(event, matcher)`. `<scope>` is one of
the 11 `HARNESS_SCOPES` (`scripts/lib/harness-hook-policy.ts`): `core`, `solid`, `rules`,
`carto`, `security`, `changelog`, `aipilot`, `lessons`, `seo`, `memory`, `tailwindcss`.
`bun run validate` runs `validateHarnessHookWiring` (`scripts/lib/harness-hook-validation.ts`)
and fails the build on any command that is not byte-identical to
`canonicalHarnessCommand(plugin, event, matcher)`, on a duplicate handler, or on a handler with
no registered route.

---

## (b) Adding a NEW event/matcher for a plugin

1. Edit `plugins/<plugin>/hooks/hooks.json` — add the `(event, matcher)` block using the
   canonical command for the scope you're targeting (copy the shape in (a), swap `<scope>`).
2. Add the matching route to `scripts/lib/harness-hook-routes.json`
   (`{ "plugin", "event", "matcher", "scope" }`) — `canonicalHarnessCommand` reads this file to
   decide what command is legal for that tuple.
3. Run `bun run validate`. It rejects: an unregistered tuple, a duplicate handler, or a command
   that doesn't match the route exactly.
4. **IMPORTANT**: a changed `command` string invalidates the Codex hook-trust hash. Trust is a
   bit-exact SHA-256 over the normalized `(event, matcher, command, timeout)` tuple, persisted
   as `[hooks.state."<key>"].trusted_hash` in `config.toml`
   (`scripts/lib/install/hooks-trust.ts`). After wiring a new or changed tuple, the installer's
   "Trust all fusengine hooks" prompt (or a manual `/hooks` review in Codex) must run again —
   an untrusted hook is skipped **silently**, it does not error.

---

## (c) Where hook LOGIC lives

Never in this repo. New check logic is written in the `@fusengine/harness` package (repo
`fuse-harness`), as a scope handler under `src/runtime/lifecycle/**` — one scope per
plugin/domain (e.g. `solid-detect.ts`, `check-file-size.ts`). To ship a change:

1. Land the handler + its tests in the harness repo, release to npm.
2. Back here, run `bun run update-harness` (`scripts/update-harness.ts`): bumps the
   `@fusengine/harness` dependency, reinstalls, re-audits all 11 scopes, and advances the
   `HARNESS_VERSION` tripwire (`scripts/lib/harness-hook-policy.ts`).
   `validateHarnessHookWiring` fails the build if the installed harness version doesn't match
   the last-audited one — this is what forces a re-audit on every harness bump, not a manual
   reminder.

---

## Forbidden

- A plugin-local hook script of any kind — a `hooks.json` command must always be the canonical
  Harness route, never a hand-rolled one.
- `*.native.ts` hook entries, `// @hook-entry` files, `scripts/build-hooks.ts`.
- `dist/hooks` bundle output, `packages/codex-hooks`.

These made up a Claude-era layer (stdin-JSON input, `permissionDecision` output contract) that
Codex's `hooks.json` never actually invoked once every plugin was routed through the harness
(commit `ca01ff99`, 2026-07-11 — "route all plugins through harness"). They sat dead — bundled
but unwired — until removed on 2026-09-19. Any reference to them elsewhere in the docs is
stale; fix it, don't resurrect the pattern.

---

## Notes

- `hooks/hooks.json` never contains a hand-written command — only the canonical Harness route
  for the plugin's declared `(event, matcher)` tuples.
- Reference check-logic scripts (SOLID size/interface rules per stack, skill-read tracker) —
  now historical illustrations only, not a porting target — live in
  `hook-scripts-reference.md`, continued in `hook-scripts-reference-2.md`.
