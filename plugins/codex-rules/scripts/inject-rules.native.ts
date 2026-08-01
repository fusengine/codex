#!/usr/bin/env bun
// @hook-entry
/**
 * inject-rules.native.ts — runtime rules injector (REACTIVATED).
 *
 * Re-injects the codex-rules corpus (rules/*.md, 00→08 sorted) on every
 * SessionStart / SubagentStart / UserPromptSubmit via
 * `hookSpecificOutput.additionalContext` — PARITY with the Kimi ecosystem,
 * where the same corpus is re-injected at each prompt. The owner reverted the
 * earlier mute (the TUI card additionalContext prints is now accepted). This
 * COEXISTS with the install-time merge into ~/.codex/AGENTS.md
 * (scripts/lib/install/merge-agents-md.ts): AGENTS.md is the native silent
 * baseline, this hook re-surfaces the rules in-context on every event.
 *
 * Rules-dir resolution: `PLUGIN_ROOT` first (Codex sets it for plugin hooks =
 * installed plugin root in the cache), else script-relative `../rules`
 * (source-tree/dev fallback — bundled code must not rely on import.meta.path,
 * oven-sh/bun#15994, so the fallback only holds when run from source; plugin
 * hooks always get PLUGIN_ROOT).
 *
 * Kill switch: `FUSE_RULES_INJECT=0` restores the muted no-op (stderr notice,
 * no stdout, exit 0) so injection can be cut without redeploying.
 *
 * NOTE: harness ≥0.1.83 answers `hook <id> rules` internally
 * (runtime/lifecycle/inject-rules.ts) and never spawns this bundle on that
 * path; this script stays the plugin-declared reference emitter for any
 * direct invocation.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** Muted no-op: stderr notice, no stdout, exit 0 (kill switch / missing corpus). */
function noop(reason: string): never {
  process.stderr.write(`rules: ${reason}\n`);
  process.exit(0);
}

if (process.env.FUSE_RULES_INJECT === "0") noop("injection disabled (FUSE_RULES_INJECT=0)");

let data: { hook_event_name?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
const event = data.hook_event_name ?? "SessionStart";

const pluginRoot = process.env.PLUGIN_ROOT ?? resolve(import.meta.dir, "..");
const rulesDir = join(pluginRoot, "rules");
if (!existsSync(rulesDir)) noop(`no rules dir at ${rulesDir}`);

/** Concatenate rules/*.md sorted (00→08) — same order/shape as merge-agents-md.readRulesCorpus. */
const corpus = readdirSync(rulesDir)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => readFileSync(join(rulesDir, f), "utf-8").trimEnd())
  .join("\n\n");
if (!corpus) noop(`empty rules corpus at ${rulesDir}`);

process.stderr.write(`rules: 00-08 injected (${event})\n`);
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: event, additionalContext: corpus },
}));
