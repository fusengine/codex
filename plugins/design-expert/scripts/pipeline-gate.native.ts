#!/usr/bin/env bun
// @hook-entry
/**
 * pipeline-gate.native.ts — native TS port of _legacy_py/pipeline-gate.py.
 *
 * PreToolUse: enforce phase ordering via the per-agent design state. No-op
 * unless the design flag is set and the event has an agent_id. Auto-creates the
 * state file when missing (teammate context). Routes design-system.md writes,
 * Gemini create_frontend and Playwright navigate to their gate checks, then
 * allow_pass. Reuses the shared design-state + pipeline-checks.
 */
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import {
  FLAG_FILE, loadState, saveState, defaultState, type DesignState,
} from "./lib/design-state";
import {
  checkDesignSystemWrite, checkGeminiCreate, checkPlaywrightNavigate,
} from "./lib/pipeline-checks";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

let data: { agent_id?: string; tool_name?: string; tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (!existsSync(FLAG_FILE)) process.exit(0);
const agentId = data.agent_id || "";
if (!agentId) process.exit(0);

let state: DesignState | null = loadState(agentId);
if (!state) {
  const cwd = process.cwd();
  const dsExists = ["design-system.md", "../design-system.md"].some((f) => existsSync(join(cwd, f)));
  state = defaultState(agentId, dsExists ? "page" : "full", dsExists);
  saveState(state);
}

const tool = data.tool_name ?? "";
const fp = data.tool_input?.file_path ?? "";

if ((tool === "Write" || tool === "Edit") && basename(fp) === "design-system.md") {
  checkDesignSystemWrite(state);
} else if (tool === "mcp__gemini-design__create_frontend") {
  checkGeminiCreate(state);
} else if (tool === "mcp__playwright__browser_navigate") {
  checkPlaywrightNavigate(state);
}

allowPass("pipeline-gate", `phase ${state.current_phase ?? 0} ok`);
