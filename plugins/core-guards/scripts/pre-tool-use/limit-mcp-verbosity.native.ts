#!/usr/bin/env bun
// @hook-entry
/**
 * limit-mcp-verbosity.native.ts — native TS port of
 * _legacy_py/pre-tool-use/limit-mcp-verbosity.py.
 *
 * PreToolUse: cap verbose MCP tool inputs (exa numResults/tokensNum,
 * context7 tokens) and emit an allow with updatedInput only when something
 * changed. Caps, substring matching and JSON shape are verbatim for parity.
 */
const MAX_NUM_RESULTS = 3;
const MAX_TOKENS = 2000;

type ToolInput = Record<string, unknown>;

/** Coerce to a positive int capped at ceiling, or null (mirrors _cap_int). */
function capInt(value: unknown, ceiling: number): number | null {
  const n = typeof value === "boolean" ? NaN : Number.parseInt(String(value as never), 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  if (n <= 0) return null;
  return Math.min(n, ceiling);
}

/** Cap exa web_search numResults (defaults to ceiling when absent/invalid). */
function capExaSearch(ti: ToolInput): ToolInput | null {
  const current = ti.numResults;
  let capped = capInt(current, MAX_NUM_RESULTS);
  if (capped === null) capped = MAX_NUM_RESULTS;
  if (current === capped) return null;
  return { ...ti, numResults: capped };
}

/** Cap each present field; return updated input only when something changed. */
function capFields(ti: ToolInput, caps: [string, number][]): ToolInput | null {
  const updated: ToolInput = { ...ti };
  let changed = false;
  for (const [field, ceiling] of caps) {
    if (!(field in updated)) continue;
    const capped = capInt(updated[field], ceiling);
    if (capped !== null && updated[field] !== capped) {
      updated[field] = capped;
      changed = true;
    }
  }
  return changed ? updated : null;
}

/** Compute the capped input for a tool, or null when nothing applies. */
function computeUpdate(toolName: string, ti: ToolInput): ToolInput | null {
  if (toolName.includes("web_search_exa")) return capExaSearch(ti);
  if (toolName.includes("get_code_context_exa")) {
    return capFields(ti, [["numResults", MAX_NUM_RESULTS], ["tokensNum", MAX_TOKENS]]);
  }
  if (toolName.includes("context7") && toolName.includes("query")) {
    return capFields(ti, [["tokens", MAX_TOKENS]]);
  }
  return null;
}

let data: { tool_name?: string; tool_input?: unknown };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
const ti = data.tool_input;
if (!ti || typeof ti !== "object" || Array.isArray(ti)) process.exit(0);
const updated = computeUpdate(data.tool_name ?? "", ti as ToolInput);
if (updated === null) process.exit(0);
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow", updatedInput: updated },
}));
