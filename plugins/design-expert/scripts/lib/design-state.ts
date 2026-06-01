/**
 * design-state.ts — shared state for the design-expert pipeline hooks.
 *
 * Ports the CACHE_DIR/FLAG_FILE layout + load_state/save_state/deny from
 * pipeline_checks.py and the .design-state-<agent>.json schema from
 * design-state-init.py. The flag-gate helper centralizes the "is this the active
 * design agent" check shared by guard/enforce/pipeline/track hooks. JSON is
 * indent=2 to match json.dump; isoNow mimics Python datetime.isoformat (+00:00).
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const CACHE_DIR = join(process.env.CODEX_HOME || join(homedir(), ".codex"), "fusengine");
export const FLAG_FILE = join(CACHE_DIR, "design-agent-active");
export const MIN_SCREENSHOTS: Record<string, number> = { full: 4, page: 2, component: 0 };

/** Pipeline state record (field order matches the Python schema). */
export interface DesignState {
  agent_id: string; mode: string; current_phase: number;
  phases_completed: string[]; templates_read: boolean; inspiration_read: boolean;
  screenshots_count: number; design_system_exists: boolean; design_system_valid: boolean;
  gemini_calls: number; auto_review_done: boolean; created_at: string; updated_at: string;
}

/** UTC timestamp mimicking Python datetime.now(timezone.utc).isoformat(). */
export function isoNow(): string {
  return new Date().toISOString().replace("Z", "+00:00");
}

function isFile(p: string): boolean { try { return statSync(p).isFile(); } catch { return false; } }
function statePath(agentId: string): string { return join(CACHE_DIR, `.design-state-${agentId}.json`); }

/** Read the active design agent id from the flag file, or "" when inactive. */
export function flagAgentId(): string {
  if (!isFile(FLAG_FILE)) return "";
  try { return readFileSync(FLAG_FILE, "utf8").trim(); } catch { return ""; }
}

/**
 * Resolve the gated agent id for hooks that act only for the active design agent:
 * returns the event's agent_id when the flag is set and matches (or has no id),
 * else null (caller should exit 0). Mirrors the shared guard pattern.
 */
export function gatedAgentId(agentId: string): string | null {
  if (!isFile(FLAG_FILE)) return null;
  const designId = flagAgentId();
  if (!agentId || (designId && agentId !== designId)) return null;
  return agentId;
}

/** Load state for agentId, or null if missing/unreadable. */
export function loadState(agentId: string): DesignState | null {
  const path = statePath(agentId);
  if (!isFile(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf8")) as DesignState; } catch { return null; }
}

/** Save state, stamping updated_at (mirrors save_state). */
export function saveState(state: DesignState): void {
  state.updated_at = isoNow();
  writeFileSync(statePath(state.agent_id), JSON.stringify(state, null, 2), "utf8");
}

/** Build a default pipeline state record. */
export function defaultState(agentId: string, mode: string, dsExists: boolean): DesignState {
  const now = isoNow();
  return {
    agent_id: agentId, mode, current_phase: 0, phases_completed: [],
    templates_read: false, inspiration_read: false, screenshots_count: 0,
    design_system_exists: dsExists, design_system_valid: false, gemini_calls: 0,
    auto_review_done: false, created_at: now, updated_at: now,
  };
}

/** Emit a PreToolUse deny and exit (mirrors pipeline_checks.deny). */
export function deny(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  }));
  process.exit(0);
}
