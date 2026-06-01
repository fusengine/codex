#!/usr/bin/env bun
// @hook-entry
/**
 * track-subagent-research.native.ts — native TS port of
 * _legacy_py/post-tool-use/track-subagent-research.py.
 *
 * PostToolUse (sub-agents only): record APEX phase completions when a sub-agent
 * uses an MCP research tool, a native exploration tool, an exploration Bash
 * command, or reads a cached MCP result. State keys, phase labels, quality rule
 * and timestamp format are faithful to the Python.
 */
import { loadSessionState, saveSessionState } from "../_shared/state-manager";
import { utcStamp } from "../_shared/track-time";
import { bashExecutable } from "../_shared/track-shell";
import {
  CACHE_READ_RE, EXPLORE_BASH_CMDS, EXPLORE_TOOLS, RESEARCH_TOOLS,
} from "../_shared/apex-constants";

interface Payload {
  tool_name?: string;
  session_id?: string;
  agent_id?: string;
  tool_input?: { file_path?: string; command?: string };
  tool_response?: unknown;
}

/** Map (tool_name, tool_input) to [phase, cacheHit] or null to skip. */
function classify(tool: string, ti: { file_path?: string; command?: string }): [string, boolean] | null {
  if (RESEARCH_TOOLS.has(tool)) return ["subagent-research-expert", false];
  if (EXPLORE_TOOLS.has(tool)) return ["subagent-explore-codebase", false];
  if (tool === "Read") {
    const path = ti.file_path ?? "";
    if (path && CACHE_READ_RE.test(path)) return ["subagent-research-expert", true];
    return null;
  }
  if (tool === "Bash") {
    const cmd = (ti.command ?? "").trim();
    if (EXPLORE_BASH_CMDS.has(bashExecutable(cmd))) return ["subagent-explore-codebase", false];
  }
  return null;
}

let data: Payload;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (!data.agent_id) process.exit(0);

const classified = classify(data.tool_name ?? "", data.tool_input ?? {});
if (classified === null) process.exit(0);
const [phase, cacheHit] = classified;

const sid = data.session_id || "unknown";
const state = loadSessionState(sid);
const agents = (state.agents ??= []) as unknown[];
const resp = data.tool_response;
const responseLength = resp ? String(resp).length : 0;
const quality = cacheHit || responseLength > 50 ? "sufficient" : "insufficient";

agents.push({
  timestamp: utcStamp(),
  type: phase,
  agent_id: data.agent_id ?? "",
  tool_name: data.tool_name ?? "",
  response_length: responseLength,
  quality,
});

saveSessionState(sid, state);
process.exit(0);
