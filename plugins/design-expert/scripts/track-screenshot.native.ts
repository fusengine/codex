#!/usr/bin/env bun
// @hook-entry
/**
 * track-screenshot.native.ts — native TS port of _legacy_py/track-screenshot.py.
 *
 * PostToolUse (active design agent only): increment screenshots_count; when the
 * count reaches the mode threshold and phase < 2, advance to phase 2 and mark
 * identity+research complete. Reuses the shared design-state + MIN_SCREENSHOTS.
 */
import { gatedAgentId, loadState, saveState, MIN_SCREENSHOTS } from "./lib/design-state";

let data: { agent_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const agentId = gatedAgentId(data.agent_id ?? "");
if (agentId === null) process.exit(0);

const state = loadState(agentId);
if (!state) process.exit(0);

const count = (state.screenshots_count ?? 0) + 1;
state.screenshots_count = count;
const needed = MIN_SCREENSHOTS[state.mode ?? "full"] ?? 4;
if (count >= needed && (state.current_phase ?? 0) < 2) {
  state.current_phase = 2;
  for (const p of ["identity", "research"]) {
    if (!state.phases_completed.includes(p)) state.phases_completed.push(p);
  }
}
saveState(state);
process.exit(0);
