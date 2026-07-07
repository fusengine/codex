#!/usr/bin/env bun
// @hook-entry
/**
 * check-security-skill.native.ts — native TS port of
 * _legacy_py/check-security-skill.py. PreToolUse: advisory (never denies). When
 * editing source and today's 00-security state has not recorded skill_read, emit
 * an allow + additionalContext nudge. STRICT parity: local date, allow JSON shape.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { iterEditTargets } from "../../core-guards/scripts/_shared/track-edit-targets";

const FILE_RE = /\.(ts|tsx|js|jsx|py|php|swift|go|rs|rb|java)$/;

/** First edited source target (mirrors first_edit_target with the source filter). */
function firstTarget(data: Parameters<typeof iterEditTargets>[0]) {
  for (const t of iterEditTargets(data)) if (FILE_RE.test(t.file_path)) return t;
  return null;
}

/** Local-date YYYY-MM-DD (mirrors Python date.today().isoformat()). */
function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let data: Parameters<typeof iterEditTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (!firstTarget(data)) process.exit(0);

const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const stateFile = join(codexHome, "logs", "00-security", `${localToday()}-state.json`);
if (existsSync(stateFile)) {
  try {
    const state = JSON.parse(readFileSync(stateFile, "utf-8"));
    if (state.skill_read === true) process.exit(0);
  } catch { /* fall through to advisory */ }
}

const advisory =
  "SECURITY: Read security skill references before modifying code." +
  " Use: Read skills/security-scan/references/scan-patterns.md";
// Advisory only, never blocks. Codex rejects a bare permissionDecision:"allow"
// (hook FAILED), so emit additionalContext alone — the documented non-blocking
// context shape (valid on Codex builds >= 2026-05-05 / PR #20692).
console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: advisory,
  },
}));
