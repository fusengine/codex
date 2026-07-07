#!/usr/bin/env bun
// @hook-entry
/**
 * inject-claude-md.native.ts — MUTED emitter.
 *
 * Was the second SessionStart source re-injecting the FULL ~/.codex/AGENTS.md
 * as `hookSpecificOutput.additionalContext` — always printed as a visible TUI
 * card, redundant with Codex's own NATIVE, SILENT load of that same file
 * (codex-rs/core/src/agents_md.rs). The owner rejected the visible card, so
 * this hook no longer emits additionalContext; it keeps its hooks.log trail
 * (useful for debugging what Codex actually loaded) and stays wired in
 * hooks.json as a harmless no-op across Claude Code, Cursor, and Hermes.
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

try {
  readFileSync(claudeMd, "utf-8");
} catch {
  log("ERROR: Cannot read AGENTS.md");
  process.exit(0);
}

log("AGENTS.md present — native Codex load handles injection, hook stays silent");
process.stderr.write("rules: merged into AGENTS.md\n");
process.exit(0);
