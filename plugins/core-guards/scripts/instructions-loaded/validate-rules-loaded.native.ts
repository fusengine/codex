#!/usr/bin/env bun
// @hook-entry
/**
 * validate-rules-loaded.native.ts — native TS port of
 * _legacy_py/instructions-loaded/validate-rules-loaded.py.
 *
 * InstructionsLoaded: append a debug line "<load_reason> | <memory_type> |
 * <file_path>" to ~/.codex/logs/instructions-loaded/<session_id>.log. No
 * decision control — always exits 0. Log path + line format verbatim for parity.
 */
import { mkdirSync, appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let data: Record<string, unknown>;
try {
  const parsed = JSON.parse(await Bun.stdin.text());
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) process.exit(0);
  data = parsed;
} catch {
  process.exit(0);
}

const filePath = (data.file_path as string) ?? "";
const loadReason = (data.load_reason as string) ?? "";
const memoryType = (data.memory_type as string) ?? "";
const sessionId = (data.session_id as string) ?? "unknown";

try {
  const logDir = join(homedir(), ".codex", "logs", "instructions-loaded");
  mkdirSync(logDir, { recursive: true });
  appendFileSync(join(logDir, `${sessionId}.log`), `${loadReason} | ${memoryType} | ${filePath}\n`);
} catch {
  /* best-effort; InstructionsLoaded has no decision control */
}
process.exit(0);
