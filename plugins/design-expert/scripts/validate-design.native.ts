#!/usr/bin/env bun
// @hook-entry
/**
 * validate-design.native.ts — native TS port of _legacy_py/validate-design.py.
 *
 * PostToolUse: when design-system.md is written, advance state to phase 3 and
 * post_pass (early return). Otherwise run the design checks on each .tsx/.jsx/.css
 * target read from disk; if any warnings, emit a PostToolUse additionalContext
 * line, then post_pass. Two stdout JSON objects on warnings, matching the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { postPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { runAllChecks } from "./lib/design-checks";
import { FLAG_FILE, flagAgentId, loadState, saveState } from "./lib/design-state";

const CODE_RE = /\.(tsx|jsx|css)$/;

/** Advance pipeline state to phase 3 when design-system.md is written. */
function advanceStateForDs(agentId: string): void {
  const state = loadState(agentId);
  if (!state) return;
  state.design_system_exists = true;
  state.design_system_valid = true;
  state.current_phase = Math.max(state.current_phase ?? 0, 3);
  if (!state.phases_completed.includes("design-system")) state.phases_completed.push("design-system");
  saveState(state);
}

let data: { tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const warnings: string[] = [];
for (const target of editTargets(data)) {
  const filePath = target.filePath;
  if (basename(filePath) === "design-system.md") {
    if (existsSync(FLAG_FILE)) {
      try { advanceStateForDs(flagAgentId()); } catch { /* best effort */ }
    }
    postPass("validate-design", "design-system.md → phase 3");
    process.exit(0);
  }
  if (!CODE_RE.test(filePath) || !existsSync(filePath)) continue;
  let content: string;
  try { content = readFileSync(filePath, "utf8"); } catch { continue; }
  warnings.push(...runAllChecks(content));
}

if (warnings.length) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: warnings.join(" ") },
  }));
}
postPass("validate-design", "design ok");
