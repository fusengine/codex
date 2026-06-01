#!/usr/bin/env bun
// @hook-entry
/**
 * track-memory-ops.native.ts — native TS port of _legacy_py/track-memory-ops.py.
 *
 * PostToolUse: append "[ts] <tool> | <ok|error>" to 00-memory/operations.log
 * and rotate to the last 500 lines when it exceeds 1000. Tool default, the
 * error detection via tool_result.error and the rotation thresholds are
 * verbatim from the Python.
 */
import { readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { utcTs, memoryLogDir } from "./lib/neural";

const logDir = memoryLogDir();

let data: { tool_name?: string; tool_result?: { error?: unknown } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "unknown";
const status = data.tool_result?.error ? "error" : "ok";
const logFile = join(logDir, "operations.log");

try {
  appendFileSync(logFile, `[${utcTs()}] ${tool} | ${status}\n`);
} catch {
  process.exit(0);
}

try {
  const lines = readFileSync(logFile, "utf-8").split("\n");
  // readlines() keeps line terminators but no trailing empty; drop ours.
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  if (lines.length > 1000) {
    writeFileSync(logFile, lines.slice(-500).map((l) => `${l}\n`).join(""));
  }
} catch {
  /* ignore rotation failure */
}
process.exit(0);
