#!/usr/bin/env bun
// @hook-entry
/**
 * log-tool-failure.native.ts — native TS port of
 * _legacy_py/post-tool-use/log-tool-failure.py.
 *
 * PostToolUseFailure: append a TOOL_FAILURE line to tool-failures.log, skipping
 * user interrupts. Log line format and timestamp format match the Python.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { utcStamp } from "../_shared/track-time";

const LOG_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "logs");

let data: {
  tool_name?: string; error?: string; is_interrupt?: boolean; session_id?: string;
};
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (data.is_interrupt) process.exit(0);

const tool = data.tool_name ?? "unknown";
const error = data.error ?? "unknown error";
const sid = data.session_id ?? "unknown";
const line = `[${utcStamp()}] TOOL_FAILURE session=${sid} tool=${tool} error=${error}\n`;

try {
  mkdirSync(LOG_DIR, { recursive: true });
  appendFileSync(join(LOG_DIR, "tool-failures.log"), line);
} catch { /* ignore */ }

process.exit(0);
