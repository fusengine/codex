#!/usr/bin/env bun
// @hook-entry
/**
 * track-watch-research.native.ts — native TS port of
 * _legacy_py/track-watch-research.py.
 *
 * PostToolUse: when a research tool (Exa/fuse-browser/web.run) ran, append the
 * query/url/prompt to ~/.codex/logs/00-changelog/<UTC-date>-research.json. The
 * state file, the tool-name substring match, the field fallback order and the
 * 2-space indented JSON are verbatim from the Python for parity.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface ToolInput { query?: string; url?: string; prompt?: string; }
interface Research { queries: Array<{ timestamp: string; tool: string; query: string }>; }

let data: { tool_name?: string; tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "";
if (!["exa", "fuse-browser", "browser_fetch", "web.run"].some((k) => tool.includes(k))) process.exit(0);

const ti = data.tool_input ?? {};
const query = ti.query || ti.url || ti.prompt || "";

const codex = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const stateDir = join(codex, "logs", "00-changelog");
mkdirSync(stateDir, { recursive: true });
const now = new Date();
const today = now.toISOString().slice(0, 10);
const stateFile = join(stateDir, `${today}-research.json`);
const ts = `${now.toISOString().slice(0, 19)}Z`;

let state: Research = { queries: [] };
if (existsSync(stateFile)) {
  try {
    state = JSON.parse(readFileSync(stateFile, "utf-8"));
  } catch {
    state = { queries: [] };
  }
}
state.queries.push({ timestamp: ts, tool, query });

try {
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
} catch {
  /* best-effort */
}
process.exit(0);
