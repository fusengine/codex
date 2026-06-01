#!/usr/bin/env bun
// @hook-entry
/**
 * track-mcp-research.native.ts — native TS port of _legacy_py/track-mcp-research.py
 * (design-expert).
 *
 * PostToolUse for mcp__* tools: record an MCP research event in the APEX day-state
 * (shared trackMcpResearch). Playwright tools (no query) derive a query from the
 * url / fullPage flag. For playwright/gemini-design, also append a per-agent
 * tracking line (used by require-scroll + screenshot counts). Matches Python.
 */
import { trackMcpResearch } from "../../core-guards/scripts/_shared/expert-skill-tracking";
import { appendAgentTrack } from "./lib/skill-tracking";

let data: { session_id?: string; agent_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const toolName = data.tool_name ?? "";
if (!/^mcp__/.test(toolName)) process.exit(0);

const ti = (data.tool_input ?? {}) as Record<string, unknown>;
let query = String(ti.query || ti.topic || "");
if (toolName.includes("playwright") && !query) {
  query = String(ti.url || toolName);
  if (toolName.includes("screenshot")) query = `playwright_screenshot ${ti.fullPage ?? false}`;
}
if (!query) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
const agentId = data.agent_id || "";
let source = "mcp";
if (toolName.includes("context7")) source = "context7";
else if (toolName.includes("exa")) source = "exa";

trackMcpResearch(source, toolName, query, sessionId);

if (agentId && (toolName.includes("playwright") || toolName.includes("gemini-design"))) {
  const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  appendAgentTrack(agentId, `${ts} ${source}:${toolName} ${query}`);
}
process.exit(0);
