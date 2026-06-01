#!/usr/bin/env bun
// @hook-entry
/**
 * inject-rules.native.ts — native TS port of _legacy_py/inject-rules.py.
 *
 * SessionStart/UserPromptSubmit: inject all rules/*.md (sorted) as
 * additionalContext. Plugin root comes from argv[2] (the wrapper/hooks.json
 * pass ${PLUGIN_ROOT}) or PLUGIN_ROOT env. The emitted hookEventName must match
 * the triggering event (Codex deny_unknown_fields per-event schema), so it is
 * read from stdin and clamped to the two valid names — verbatim parity with the
 * Python, including the stderr "rules:" line and exit codes.
 */
import { existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Read the triggering event from stdin JSON; default to SessionStart. */
async function readEvent(): Promise<string> {
  let data: unknown;
  try {
    data = JSON.parse(await Bun.stdin.text());
  } catch {
    return "SessionStart";
  }
  if (typeof data !== "object" || data === null) return "SessionStart";
  const event = (data as { hook_event_name?: string }).hook_event_name ?? "";
  return event === "SessionStart" || event === "UserPromptSubmit" ? event : "SessionStart";
}

const pluginRoot = process.argv[2] ?? process.env.PLUGIN_ROOT;
if (!pluginRoot) {
  process.stderr.write("Missing plugin root argument\n");
  process.exit(1);
}

const event = await readEvent();
const rulesDir = join(pluginRoot, "rules");
if (!existsSync(rulesDir) || !statSync(rulesDir).isDirectory()) process.exit(0);

const rules = readdirSync(rulesDir)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => join(rulesDir, f));
if (rules.length === 0) process.exit(0);

const parts: string[] = [];
for (const p of rules) {
  try {
    parts.push(readFileSync(p, "utf-8"));
  } catch {
    /* skip unreadable rule */
  }
}
if (parts.length === 0) process.exit(0);

const content = parts.join("\n\n");
process.stderr.write(`rules: ${parts.length} rules loaded (${event})\n`);
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: event, additionalContext: content },
}));
process.exit(0);
