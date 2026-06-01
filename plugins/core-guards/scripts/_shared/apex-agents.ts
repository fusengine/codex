/**
 * apex-agents.ts — APEX agent-presence checks read from session state.
 *
 * Native TS port of _legacy_py/pre-tool-use/apex_agent_helpers.py. The gate is
 * scoped to the current task turn via a generous TTL (30 min): a turn's forced
 * reads + agent spawns routinely exceed the old 180 s, which made evidence
 * expire DURING the work the gate demanded (the re-launch loop).
 */
import { loadSessionState } from "./state-manager";
import { apexAgentsInTranscript } from "../../../ai-pilot/scripts/lib/apex/rollout-agents";

const AGENT_TTL_MS = 1_800_000;
const REQUIRED = ["explore-codebase", "research-expert"];

interface AgentEntry {
  type?: string;
  quality?: string;
  timestamp?: string;
}

function safeState(sid: string): Record<string, unknown> {
  try {
    return loadSessionState(sid);
  } catch {
    return {};
  }
}

function fresh(e: AgentEntry, now: number): boolean {
  const t = Date.parse(String(e.timestamp ?? ""));
  return !Number.isNaN(t) && now - t <= AGENT_TTL_MS;
}

/** True + missing[] for the required APEX agents seen with sufficient quality. */
export function checkRequiredAgents(sid: string): { satisfied: boolean; missing: string[] } {
  const agents = (safeState(sid).agents as AgentEntry[] | undefined) ?? [];
  const now = Date.now();
  const found = new Set<string>();
  for (let i = agents.length - 1; i >= 0; i--) {
    const e = agents[i];
    if (!e || typeof e !== "object" || !fresh(e, now)) continue;
    if ((e.quality ?? "insufficient") !== "sufficient") continue;
    for (const req of REQUIRED) {
      if ((e.type ?? "").includes(req)) found.add(req);
    }
  }
  if (found.size < REQUIRED.length) {
    // Rollout ground-truth fallback: PostToolUse state writes are unreliable in
    // code_mode (openai/codex#19385), so detect explore/research from the turn's
    // rollout directly — avoids false-blocks + the manual state-write loop.
    const rt = apexAgentsInTranscript(sid);
    if (rt.explore) found.add("explore-codebase");
    if (rt.research) found.add("research-expert");
  }
  const missing = REQUIRED.filter((r) => !found.has(r));
  return { satisfied: missing.length === 0, missing };
}

/** True unless brainstorming is required and not yet done with sufficient quality. */
export function checkBrainstormDone(sid: string): boolean {
  const state = safeState(sid);
  if (!state.brainstorming_required) return true;
  const agents = (state.agents as AgentEntry[] | undefined) ?? [];
  const now = Date.now();
  for (let i = agents.length - 1; i >= 0; i--) {
    const e = agents[i];
    if (!e || typeof e !== "object" || !fresh(e, now)) continue;
    if ((e.type ?? "").includes("brainstorming")) return (e.quality ?? "") === "sufficient";
  }
  return false;
}

export { REQUIRED, AGENT_TTL_MS };
