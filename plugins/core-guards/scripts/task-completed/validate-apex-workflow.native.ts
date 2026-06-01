#!/usr/bin/env bun
// @hook-entry
/**
 * validate-apex-workflow.native.ts — native TS port of
 * _legacy_py/task-completed/validate-apex-workflow.py.
 *
 * Stop/TaskCompleted: read session state and warn if code files changed without
 * explore-codebase + research-expert + sniper, or any file exceeds 100 lines.
 * Emits a block decision unless stop_hook_active (then a systemMessage). State
 * keys, quality rule, line-count semantics and wording match the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { loadSessionState } from "../_shared/state-manager";

const MAX_LINES = 100;
const CODE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".php",
  ".cpp", ".c", ".rb", ".swift", ".kt", ".vue", ".svelte", ".astro",
]);

type State = Record<string, unknown>;
interface Agent { type?: unknown; quality?: unknown; prompt_preview?: unknown; tool_name?: unknown }

/** Code files recorded in state.changes.modifiedFiles (or top-level fallback). */
function changedCodeFiles(state: State): string[] {
  const changes = state.changes;
  let modified: unknown[] = changes && typeof changes === "object" && !Array.isArray(changes)
    ? (changes as Record<string, unknown>).modifiedFiles as unknown[] ?? [] : [];
  if ((!modified || modified.length === 0) && Array.isArray(state.modifiedFiles)) {
    modified = state.modifiedFiles as unknown[];
  }
  return (modified ?? []).map(String).filter((fp) => CODE_EXT.has(extname(fp)));
}

/** True if a sufficient-quality agent entry of *needle* type was recorded. */
function agentRecorded(state: State, needle: string): boolean {
  const agents = Array.isArray(state.agents) ? (state.agents as Agent[]) : [];
  return agents.some((e) => e && typeof e === "object" &&
    String(e.type ?? "").includes(needle) && e.quality === "sufficient");
}

/** True if a sufficient sniper run is recorded across type/prompt/tool fields. */
function sniperRecorded(state: State): boolean {
  const agents = Array.isArray(state.agents) ? (state.agents as Agent[]) : [];
  return agents.some((e) => e && typeof e === "object" && e.quality === "sufficient" &&
    [e.type, e.prompt_preview, e.tool_name].map((v) => String(v ?? "")).join(" ").toLowerCase().includes("sniper"));
}

/** Files whose line count exceeds MAX_LINES (Python sum(1 for _ in f)). */
function filesOverLimit(paths: string[]): string[] {
  const out: string[] = [];
  for (const fp of paths) {
    if (!existsSync(fp)) continue;
    let count: number;
    try {
      const parts = readFileSync(fp, "utf-8").split("\n");
      count = parts.length - (parts[parts.length - 1] === "" ? 1 : 0);
    } catch { continue; }
    if (count > MAX_LINES) out.push(`${basename(fp)}: ${count} lines`);
  }
  return out;
}

let data: { session_id?: string; stop_hook_active?: boolean };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const state = loadSessionState(data.session_id || "unknown");
const files = changedCodeFiles(state);
if (files.length === 0) process.exit(0);

const missing: string[] = [];
if (!agentRecorded(state, "explore-codebase")) missing.push("explore-codebase before coding");
if (!agentRecorded(state, "research-expert")) missing.push("research-expert before coding");
if (!sniperRecorded(state)) missing.push("sniper validation after modifications");

const tooLong = filesOverLimit(files);
if (tooLong.length) missing.push(`files over ${MAX_LINES} lines: ${tooLong.slice(0, 5).join("; ")}`);

if (missing.length) {
  const reason = `APEX WORKFLOW WARNING: Missing step: ${missing.join("; ")}`;
  console.log(JSON.stringify(data.stop_hook_active ? { systemMessage: reason } : { decision: "block", reason }));
}
process.exit(0);
