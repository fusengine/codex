#!/usr/bin/env bun
// @hook-entry
/**
 * inject-claude-md.native.ts — native TS port of
 * _legacy_py/session-start/inject-claude-md.py.
 *
 * SessionStart: inject ~/.codex/AGENTS.md as additionalContext. Log lines,
 * stderr notice, line count and JSON envelope are faithful to the Python.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "logs");
const LOG_FILE = join(LOG_DIR, "hooks.log");

/** Append a local-time timestamped line to hooks.log (best-effort). */
function log(msg: string): void {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const d = new Date();
    const p = (n: number): string => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    appendFileSync(LOG_FILE, `[${ts}] [SessionStart/inject-claude-md] ${msg}\n`);
  } catch { /* ignore */ }
}

const claudeMd = join(homedir(), ".codex", "AGENTS.md");
if (!existsSync(claudeMd)) {
  log(`ERROR: AGENTS.md not found at ${claudeMd}`);
  process.exit(0);
}

let content: string;
try {
  content = readFileSync(claudeMd, "utf-8");
} catch {
  log("ERROR: Cannot read AGENTS.md");
  process.exit(0);
}

const lines = (content.match(/\n/g) ?? []).length + 1;
log("Injecting AGENTS.md into session context");
process.stderr.write(`AGENTS.md loaded (${lines} lines)\n`);

console.log(JSON.stringify({ hookSpecificOutput: {
  hookEventName: "SessionStart",
  additionalContext: content,
} }));

log(`AGENTS.md injected successfully (${lines} lines)`);
process.exit(0);
