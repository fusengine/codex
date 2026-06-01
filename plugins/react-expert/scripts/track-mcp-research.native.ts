#!/usr/bin/env bun
// @hook-entry
/**
 * track-mcp-research.native.ts — native TS port of
 * _legacy_py/track-mcp-research.py (react-expert).
 *
 * PostToolUse: for any mcp__* tool call carrying a query/topic, record an MCP
 * research event (source = context7|exa|mcp) into the APEX day-state. Reuses the
 * shared trackMcpResearch so the state side-effect matches the Python.
 */
import { trackMcpResearch } from "../../core-guards/scripts/_shared/expert-skill-tracking";

let data: { session_id?: string; tool_name?: string; tool_input?: { query?: string; topic?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const toolName = data.tool_name ?? "";
if (!/^mcp__/.test(toolName)) process.exit(0);

const query = data.tool_input?.query || data.tool_input?.topic || "";
if (!query) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
let source = "mcp";
if (toolName.includes("context7")) source = "context7";
else if (toolName.includes("exa")) source = "exa";

trackMcpResearch(source, toolName, query, sessionId);
process.exit(0);
