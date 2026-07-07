#!/usr/bin/env bun
// @hook-entry
/**
 * inject-rules.native.ts — native TS port of _legacy_py/inject-rules.py.
 *
 * SessionStart/UserPromptSubmit: inject all rules/*.md (sorted) as additionalContext.
 * Plugin root comes from argv[2] (the hooks.json passes ${PLUGIN_ROOT}) or PLUGIN_ROOT env.
 * The emitted hookEventName must match the triggering event (Codex deny_unknown_fields
 * per-event schema), read from stdin and clamped to the two valid names.
 *
 * Dedup: SessionStart already injects the rules once per session (thread scope, re-fired on
 * compact). The UserPromptSubmit path (same script, turn scope) would re-emit the same rules
 * every prompt — cumulating identical developer messages in the transcript — so it injects
 * only on the FIRST prompt of the session (safety net if SessionStart was truncated) then
 * stays silent. SessionStart is unchanged. Flag reuses the shared per-session state.
 */
import { existsSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Read the triggering event + session id from stdin JSON; default to SessionStart. */
async function readPayload(): Promise<{ event: string; sessionId: string }> {
  let data: unknown;
  try {
    data = JSON.parse(await Bun.stdin.text());
  } catch {
    return { event: "SessionStart", sessionId: "" };
  }
  if (typeof data !== "object" || data === null) return { event: "SessionStart", sessionId: "" };
  const d = data as { hook_event_name?: string; session_id?: string };
  const event = d.hook_event_name === "UserPromptSubmit" ? "UserPromptSubmit" : "SessionStart";
  const sessionId = typeof d.session_id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(d.session_id) ? d.session_id : "";
  return { event, sessionId };
}

const pluginRoot = process.argv[2] ?? process.env.PLUGIN_ROOT;
if (!pluginRoot) {
  process.stderr.write("Missing plugin root argument\n");
  process.exit(1);
}

const { event, sessionId } = await readPayload();
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

// SessionStart is the SOLE emitter (it re-fires on compact/clear). The former first-prompt
// safety net doubled the rules corpus on every new session — owner-rejected: silent, always.
if (event === "UserPromptSubmit") process.exit(0);

const content = parts.join("\n\n");
process.stderr.write(`rules: ${parts.length} rules loaded (${event})\n`);
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: event, additionalContext: content },
}));
process.exit(0);
