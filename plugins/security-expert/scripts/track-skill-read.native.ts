#!/usr/bin/env bun
// @hook-entry
/**
 * track-skill-read.native.ts — native TS port of
 * _legacy_py/track-skill-read.py (security flavor). PostToolUse: when a Read/shell
 * command touches a security skill doc, set skill_read=true and append the read
 * in today's (UTC) 00-security state. STRICT parity: state shape + JSON indent=2.
 */
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { skillDocPathFromPayload } from "../../core-guards/scripts/_shared/shell-read-paths";

const SKILL_RE = /skills\/(security-scan|cve-research|dependency-audit|security-headers|auth-audit)\//;

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const filePath = skillDocPathFromPayload(data);
if (!SKILL_RE.test(filePath)) process.exit(0);

const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const today = new Date().toISOString().slice(0, 10);
const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const stateFile = join(codexHome, "logs", "00-security", `${today}-state.json`);
mkdirSync(dirname(stateFile), { recursive: true });

let state: Record<string, unknown> = { skill_read: false, reads: [] };
if (existsSync(stateFile)) {
  try { state = JSON.parse(readFileSync(stateFile, "utf-8")); } catch { /* keep default */ }
}
state.skill_read = true;
const reads = (state.reads as unknown[]) ?? [];
reads.push({ timestamp, file: filePath });
state.reads = reads;
writeFileSync(stateFile, JSON.stringify(state, null, 2));
