#!/usr/bin/env bun
// @hook-entry
/**
 * track-mcp-research.native.ts — native TS port of
 * _legacy_py/track-mcp-research.py (security flavor). PostToolUse on context7/exa
 * calls: append {timestamp, tool, query} to today's (UTC) 00-security state
 * research list. STRICT parity: provider match, query keys, state shape, indent=2.
 */
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

let data: { tool_name?: string; tool_input?: { query?: string; libraryId?: string; libraryName?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const toolName = data.tool_name ?? "";
if (!toolName.includes("context7") && !toolName.includes("exa")) process.exit(0);

const ti = data.tool_input ?? {};
const query = ti.query || ti.libraryId || ti.libraryName || "";

const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const today = new Date().toISOString().slice(0, 10);
const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const stateFile = join(codexHome, "logs", "00-security", `${today}-state.json`);
mkdirSync(dirname(stateFile), { recursive: true });

let state: Record<string, unknown> = { skill_read: false, reads: [], research: [] };
if (existsSync(stateFile)) {
  try { state = JSON.parse(readFileSync(stateFile, "utf-8")); } catch { /* keep default */ }
}
const research = (state.research as unknown[]) ?? [];
research.push({ timestamp, tool: toolName, query });
state.research = research;
writeFileSync(stateFile, JSON.stringify(state, null, 2));
