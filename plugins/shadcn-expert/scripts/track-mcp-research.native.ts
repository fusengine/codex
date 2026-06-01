#!/usr/bin/env bun
// @hook-entry
/**
 * track-mcp-research.native.ts — native TS port of
 * _legacy_py/track-mcp-research.py (shadcn-expert).
 *
 * PostToolUse: for any mcp__* tool call carrying a query/topic, record an MCP
 * research event into the APEX day-state. Source is context7|exa|shadcn|mcp
 * (shadcn included, unlike react-expert). Reuses the shared trackMcpResearch.
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
else if (toolName.includes("shadcn")) source = "shadcn";

trackMcpResearch(source, toolName, query, sessionId);
process.exit(0);
