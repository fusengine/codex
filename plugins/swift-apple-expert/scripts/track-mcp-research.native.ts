#!/usr/bin/env bun
// @hook-entry
/**
 * track-mcp-research.native.ts — native TS port of
 * _legacy_py/track-mcp-research.py. PostToolUse on mcp__* calls: record the
 * provider (context7/exa/mcp) + query in the APEX state via the shared tracker
 * (framework routing is internal, so this matches the tailwind/swift Python).
 */
import { trackMcpResearch } from "../../core-guards/scripts/_shared/expert-skill-tracking";

let data: { tool_name?: string; session_id?: string; tool_input?: { query?: string; topic?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const toolName = data.tool_name ?? "";
if (!/^mcp__/.test(toolName)) process.exit(0);

const ti = data.tool_input ?? {};
const query = ti.query || ti.topic || "";
if (!query) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
let source = "mcp";
if (toolName.includes("context7")) source = "context7";
else if (toolName.includes("exa")) source = "exa";

trackMcpResearch(source, toolName, query, sessionId);
