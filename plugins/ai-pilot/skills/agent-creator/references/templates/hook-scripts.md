---
name: hook-scripts
description: Real Codex/Harness hook attach point — how the SOLID validation scripts actually get wired
keywords: hooks, scripts, harness, native-ts, validation, solid
---

# Hook Scripts — Attach Point

## Usage

The scripts referenced below (`hook-scripts-reference.md`) are a **validation-logic reference**, not directly wireable hook commands. In this Codex marketplace, `plugins/<plugin>/hooks/hooks.json` NEVER invokes a hand-written script — every entry calls the canonical Harness CLI route. Per `docs/reference/hooks.md:115-117`: "Do not wire a new direct script; port its behavior to Harness and add parity tests first." To enforce a check, port its logic into a `*.native.ts` hook entry (below), then bundle and validate.

---

## Real Attach Point (Codex / Harness)

1. **`plugins/<plugin>/hooks/hooks.json`** registers only the canonical Harness command per `(plugin, event, matcher)` tuple:

   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "apply_patch",
           "hooks": [
             { "type": "command", "command": "bun \"${CODEX_HOME:-$HOME/.codex}/node_modules/@fusengine/harness/dist/cli/bin.mjs\" hook codex <scope>" }
           ]
         }
       ]
     }
   }
   ```

   (Real example: `plugins/typescript-expert/hooks/hooks.json`, scope `core`.) `<scope>` is one of `HARNESS_SCOPES` (`scripts/lib/harness-hook-policy.ts`: `core`, `solid`, `rules`, `carto`, `security`, `changelog`, `aipilot`, `lessons`, `seo`, `memory`, `tailwindcss`). `bun run validate` runs `validateHarnessHookWiring` and fails the build on any command that is not byte-identical to `canonicalHarnessCommand(plugin, event, matcher)`.

2. **Per-check logic** lives as a native TypeScript hook entry: `plugins/<plugin>/scripts/<event-kebab>/<name>.native.ts`, first line `// @hook-entry`. It reads JSON from stdin (`await Bun.stdin.text()`), and resolves its own paths from `process.env.PLUGIN_ROOT` — **never** `import.meta.path` (broken post-bundle, `oven-sh/bun#15994`; `scripts/build-hooks.ts:13`). To block, it prints `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"..."}}` and still calls `process.exit(0)`; to allow, it exits `0` with no output. There is **no** `exit 1`-to-block / stderr protocol (`docs/reference/hooks.md:132-141`). Live, on-disk example: `plugins/solid/scripts/validate-solid.native.ts`.

3. **Build**: `bun scripts/build-hooks.ts <plugin>` bundles every `@hook-entry` file into the `@fusengine/harness` package.

4. **Validate**: `bun run validate` checks schema, matcher legality, and the exact canonical route (`scripts/lib/hook-config-validation.ts`, `scripts/lib/harness-hook-validation.ts`).

### Gap vs. the reference scripts

Every script in `hook-scripts-reference.md` uses a Claude-era contract — `FILE_PATH="${1:-}"` positional arg, `exit 1` to block — that matches **neither** the Codex hook input (stdin JSON) **nor** its blocking signal (`permissionDecision`, always `exit 0`). Treat them as size/interface-location CHECK LOGIC to port into a `.native.ts` entry per step 2 above; never `chmod +x` and wire one of them as-is.

---

## Installation (of the ported `.native.ts` logic, not of the reference `.sh` files)

```bash
# 1. Write the check as plugins/<plugin>/scripts/<event-kebab>/<name>.native.ts
#    first line: // @hook-entry — read stdin JSON, use process.env.PLUGIN_ROOT
# 2. Bundle it
bun scripts/build-hooks.ts <plugin>
# 3. hooks.json already points at the canonical Harness route for (plugin, event, matcher)
#    — do not add or edit a "command" by hand
# 4. Validate
bun run validate
```

## Notes

- `hooks/hooks.json` never contains a hand-written command — only the canonical Harness route for the plugin's declared `(event, matcher)` tuples.
- Blocking = `permissionDecision: "deny"` JSON on stdout + `exit 0`; there is no `exit 1` protocol.
- Use `process.env.PLUGIN_ROOT` inside the `.native.ts` file — a shell `$PLUGIN_ROOT` never reaches the process (hooks.json has no per-command env injection for it).
- Keep ported logic fast (< 1s) — same constraint the original scripts documented.
- Reference check-logic scripts (SOLID size/interface rules per stack, skill-read tracker): `hook-scripts-reference.md`, continued in `hook-scripts-reference-2.md` (Swift SOLID validation, skill-read tracker).
