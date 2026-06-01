/**
 * track-mcp-response.ts — normalize an MCP tool_response into markdown text.
 * Native TS port of _legacy_py/_shared/mcp_response.py (extract_text). The
 * JSON fallback mirrors Python's json.dumps(sort_keys=True, ensure_ascii=False,
 * default=str) — including its ", "/": " separators — so cached bodies match.
 */

const MAX_DEPTH = 5;

/** Stable stringify mirroring Python json.dumps(sort_keys=True, default=str)
 * — including the ", " and ": " separators — built by hand so string values
 * are never corrupted by separator injection. */
function pyJson(value: unknown): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "number" || t === "boolean") return String(value);
  if (t === "string") return JSON.stringify(value);
  if (t === "bigint" || t === "function" || t === "symbol") return JSON.stringify(String(value));
  if (Array.isArray(value)) return `[${value.map(pyJson).join(", ")}]`;
  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const parts = Object.keys(obj).sort().map((k) => `${JSON.stringify(k)}: ${pyJson(obj[k])}`);
    return `{${parts.join(", ")}}`;
  }
  return JSON.stringify(String(value));
}

/**
 * Extract usable markdown from an MCP tool_response.
 *
 * Accepts a string, a list of content blocks (text blocks joined; non-text
 * skipped), or any JSON-serializable structure (encoded as fallback). Recurses
 * up to depth 5 to guard against pathological structures.
 *
 * @param toolResponse - Raw tool_response value.
 * @param depth - Internal recursion guard.
 * @returns Extracted markdown text, or "".
 */
export function extractText(toolResponse: unknown, depth = 0): string {
  if (depth >= MAX_DEPTH) return "";
  if (typeof toolResponse === "string") return toolResponse;
  if (Array.isArray(toolResponse)) {
    const parts = toolResponse
      .filter((b): b is Record<string, unknown> => !!b && typeof b === "object" && (b as Record<string, unknown>).type === "text")
      .map((b) => String(b.text ?? ""));
    if (parts.length) return parts.join("\n\n");
    const nested = toolResponse
      .filter((b) => Array.isArray(b) || (b && typeof b === "object"))
      .map((b) => extractText(b, depth + 1));
    const joined = nested.filter((p) => p).join("\n\n");
    if (joined) return joined;
  }
  if (!toolResponse) return "";
  try {
    return pyJson(toolResponse);
  } catch {
    return "";
  }
}
