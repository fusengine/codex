#!/usr/bin/env bun
// @hook-entry
/**
 * validate-task-solid.native.ts — native TS port of
 * _legacy_py/task-completed/validate-task-solid.py.
 *
 * TaskCompleted: read the legacy session-<sid>-changes.json change record and
 * flag modified code files exceeding 100 lines as a SOLID violation message.
 * State file path, extension set, line limit and wording match the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, join } from "node:path";

const STATE_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "sessions");
const MAX_LINES = 100;
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".php", ".swift", ".go", ".rs", ".astro"]);

let data: { task_id?: string; task_subject?: string; session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const taskId = data.task_id ?? "";
const taskSubject = data.task_subject ?? "";
const sid = data.session_id ?? "unknown";

const stateFile = join(STATE_DIR, `session-${sid}-changes.json`);
if (!existsSync(stateFile)) process.exit(0);

let state: { modifiedFiles?: string[] };
try {
  state = JSON.parse(readFileSync(stateFile, "utf-8"));
} catch {
  process.exit(0);
}

const violations: string[] = [];
for (const fp of state.modifiedFiles ?? []) {
  if (!CODE_EXT.has(extname(fp))) continue;
  if (!existsSync(fp)) continue;
  try {
    const text = readFileSync(fp, "utf-8");
    // Match Python `sum(1 for _ in f)`: count newlines, +1 for trailing content.
    const parts = text.split("\n");
    const lineCount = parts.length - (parts[parts.length - 1] === "" ? 1 : 0);
    if (lineCount > MAX_LINES) violations.push(`${basename(fp)}: ${lineCount} lines (max ${MAX_LINES})`);
  } catch { /* ignore */ }
}

if (violations.length) {
  const msg = `SOLID VIOLATION in task '${taskSubject}' (${taskId}): ` +
    `${violations.length} file(s) exceed ${MAX_LINES} lines: ${violations.slice(0, 5).join("; ")}`;
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "TaskCompleted", additionalContext: msg } }));
}

process.exit(0);
