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
import { extractText } from "../_shared/track-mcp-response";
import { normalizeCommand } from "../_shared/normalize-command";
import {
  CACHE_READ_RE, EXPLORE_BASH_CMDS, EXPLORE_TOOLS, RESEARCH_TOOLS,
} from "../_shared/apex-constants";

interface Payload {
  tool_name?: string;
  session_id?: string;
  agent_id?: string;
  tool_input?: { file_path?: string; command?: unknown };
  tool_response?: unknown;
}

/** Map (tool_name, tool_input) to [phase, cacheHit] or null to skip. */
function classify(tool: string, ti: { file_path?: string; command?: unknown }): [string, boolean] | null {
  if (RESEARCH_TOOLS.has(tool)) return ["subagent-research-expert", false];
  if (EXPLORE_TOOLS.has(tool)) return ["subagent-explore-codebase", false];
  if (tool === "Read") {
    const path = ti.file_path ?? "";
    if (path && CACHE_READ_RE.test(path)) return ["subagent-research-expert", true];
    return null;
  }
  if (tool === "Bash") {
    const cmd = normalizeCommand(ti.command).trim();
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
// extractText normalizes Codex MCP content-block objects (and strings) to real
// text; String(resp) on an object gave "[object Object]" (len 15) → always
// "insufficient", so only the cacheHit path ever passed.
const responseLength = extractText(data.tool_response).length;
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
