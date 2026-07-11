#!/usr/bin/env bun
// @hook-entry
/**
 * track-agent-calls.native.ts — native TS port of
 * _legacy_py/post-tool-use/track-agent-calls.py.
 *
 * PostToolUse(Agent/spawn_agent): append an entry to state.agents recording
 * the spawned sub-agent's type, id, prompt preview and response length so the
 * APEX enforcement hooks can tell which phases ran. State keys, quality rule
 * and timestamp format are faithful to the Python.
 */
import { loadSessionState, saveSessionState } from "../_shared/state-manager";
import { utcStamp } from "../_shared/track-time";

interface ToolInput {
  agent_type?: string;
  subagent_type?: string;
  prompt?: string;
  message?: string;
  task?: string;
}

interface Payload {
  tool_name?: string;
  session_id?: string;
  agent_type?: string;
  agent_id?: string;
  tool_input?: ToolInput;
  tool_response?: unknown;
}

let data: Payload;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "";
// Codex V2 multi-agent spawns report tool_name as the bare "spawn_agent", or
// as "{namespace}spawn_agent" with NO separator when the namespace_tools
// capability is active (e.g. "fusengine_agentsspawn_agent",
// "collaborationspawn_agent") — endsWith() covers the bare form and every
// concatenated/dotted variant without assuming a separator.
const isSpawn = tool === "Agent" || tool.endsWith("spawn_agent");
if (!isSpawn) process.exit(0);

const sid = data.session_id || "unknown";
const ti = data.tool_input ?? {};
const agentType = data.agent_type || ti.agent_type || ti.subagent_type || "";
const agentId = data.agent_id ?? "";
const prompt = (ti.prompt || ti.message || ti.task || "").slice(0, 100);

const resp = data.tool_response;
const responseLength = resp ? String(resp).length : 0;

const state = loadSessionState(sid);
const agents = (state.agents ??= []) as unknown[];
agents.push({
  timestamp: utcStamp(),
  type: agentType,
  agent_id: agentId,
  prompt_preview: prompt,
  response_length: responseLength,
  quality: tool !== "Agent" || responseLength > 500 ? "sufficient" : "insufficient",
});

saveSessionState(sid, state);
process.exit(0);
