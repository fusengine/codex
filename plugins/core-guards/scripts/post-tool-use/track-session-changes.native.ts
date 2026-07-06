#!/usr/bin/env bun
// @hook-entry
/**
 * track-session-changes.native.ts — native TS port of
 * _legacy_py/post-tool-use/track-session-changes.py.
 *
 * PostToolUse: track cumulative code-file edits per session into state.changes
 * and emit a "sniper required" additionalContext message. State keys, dedup
 * logic, log lines and timestamp format are faithful to the Python.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { loadSessionState, saveSessionState } from "../_shared/state-manager";
import { iterEditTargets } from "../_shared/track-edit-targets";
import { utcStamp } from "../_shared/track-time";

const LOG_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "logs");
const LOG_FILE = join(LOG_DIR, "hooks.log");
const CODE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|vue|svelte|astro)$/;

/** Append a timestamped line to hooks.log; swallow I/O errors like the Python. */
function logHook(msg: string): void {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    const d = new Date();
    const p = (n: number): string => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    appendFileSync(LOG_FILE, `[${ts}] [PostToolUse/track-session-changes] ${msg}\n`);
  } catch { /* ignore */ }
}

let data: Parameters<typeof iterEditTargets>[0] & { session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  logHook("ERROR: Invalid JSON");
  process.exit(0);
}

const targets = iterEditTargets(data).map((t) => t.file_path).filter((fp) => CODE_EXT.test(fp));
if (targets.length === 0) process.exit(0);

const sid = data.session_id || "unknown";
const state = loadSessionState(sid);
const changes = (state.changes ??= { cumulativeCodeFiles: 0, modifiedFiles: [] }) as {
  cumulativeCodeFiles?: number; modifiedFiles?: string[]; [k: string]: unknown;
};

let count = changes.cumulativeCodeFiles ?? 0;
const files = changes.modifiedFiles ?? [];
for (const fp of targets) {
  logHook(`Code file detected: ${fp}`);
  if (!files.includes(fp)) {
    count += 1;
    files.push(fp);
    logHook(`Count: ${count} (new: ${fp})`);
  }
}

const ts = utcStamp();
Object.assign(changes, {
  cumulativeCodeFiles: count, modifiedFiles: files,
  lastModifiedFile: targets[targets.length - 1], lastCheck: ts,
});
state.changes = changes;
saveSessionState(sid, state);

logHook(`State saved: ${count} file(s)`);
const names = targets.map((fp) => basename(fp)).join(", ");
process.stderr.write(`sniper required: ${names}\n`);
console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse",
  additionalContext: `SNIPER VALIDATION REQUIRED: Code file(s) '${names}' were modified. ` +
    `You MUST now run the sniper agent (fuse-ai-pilot:sniper) to validate ` +
    `this modification before continuing. This is mandatory per AGENTS.md rules.` } }));
process.exit(0);
