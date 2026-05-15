/** pipeline_state.ts - State load/save + constants. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const CACHE_DIR = join(homedir(), ".codex", "fusengine-cache");
export const MIN_SCREENSHOTS: Record<string, number> = { full: 4, page: 2, component: 0 };

export interface DesignState {
	agent_id: string;
	mode?: string;
	current_phase?: number;
	phases_completed?: string[];
	templates_read?: boolean;
	inspiration_read?: boolean;
	screenshots_count?: number;
	design_system_exists?: boolean;
	design_system_valid?: boolean;
	gemini_calls?: number;
	auto_review_done?: boolean;
	created_at?: string;
	updated_at?: string;
	[key: string]: unknown;
}

/** Emit deny and exit. */
export function deny(reason: string): never {
	console.log(JSON.stringify({
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "deny",
			permissionDecisionReason: reason,
		},
	}));
	process.exit(0);
}

/** Load state file for agentId, return null if missing. */
export function loadState(agentId: string): DesignState | null {
	const path = join(CACHE_DIR, `.design-state-${agentId}.json`);
	if (!existsSync(path)) return null;
	try { return JSON.parse(readFileSync(path, "utf-8")) as DesignState; } catch { return null; }
}

/** Save updated state file. */
export function saveState(state: DesignState): void {
	state.updated_at = new Date().toISOString();
	const path = join(CACHE_DIR, `.design-state-${state.agent_id}.json`);
	writeFileSync(path, JSON.stringify(state, null, 2));
}
