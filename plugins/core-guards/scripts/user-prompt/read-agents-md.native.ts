#!/usr/bin/env bun
// @hook-entry
/**
 * read-agents-md.native.ts — UserPromptSubmit: inject ~/.codex/AGENTS.md as additionalContext,
 * EXACTLY ONCE per session. SessionStart already injects it at thread scope (re-fired on
 * compact), so re-emitting it every prompt would cumulate identical developer messages in the
 * transcript; the first prompt re-injects as a safety net, then this stays silent. The
 * per-prompt APEX nudge is owned SOLELY by ai-pilot/detect-and-inject-apex (single emitter —
 * this file no longer emits an APEX block, killing the double-injection).
 */
import { existsSync, statSync, readFileSync, mkdirSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadSessionState, saveSessionState } from "../_shared/state-manager";

const CODEX = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const LOG_FILE = join(CODEX, "fusengine", "logs", "hooks.log");

/** Append a timestamped UserPromptSubmit line to hooks.log (best-effort). */
function log(msg: string): void {
  try {
    mkdirSync(join(CODEX, "fusengine", "logs"), { recursive: true });
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    appendFileSync(LOG_FILE, `[${ts}] [UserPromptSubmit/read-claude-md] ${msg}\n`);
  } catch { /* ignore */ }
}

let data: { session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const agentsMd = join(homedir(), ".codex", "AGENTS.md");
if (!existsSync(agentsMd) || !statSync(agentsMd).isFile()) {
  log("ERROR: AGENTS.md not found");
  process.exit(0);
}
let content: string;
try {
  content = readFileSync(agentsMd, "utf-8");
} catch {
  process.exit(0);
}
process.stderr.write("memory: AGENTS.md loaded\n");

// Exactly-once per session: inject on the FIRST prompt (safety net if SessionStart was
// truncated), then stay silent — SessionStart re-fires on compact so context stays fresh.
const sid = typeof data.session_id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(data.session_id) ? data.session_id : "";
let injected = false;
try { injected = sid ? loadSessionState(sid).agentsMdInjected === true : false; } catch { injected = false; }
if (injected) process.exit(0);
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: `# AGENTS.md\n${content}` },
}));
if (sid) {
  try { const s = loadSessionState(sid); s.agentsMdInjected = true; saveSessionState(sid, s); } catch { /* best-effort */ }
}
log("AGENTS.md injected");
process.exit(0);
