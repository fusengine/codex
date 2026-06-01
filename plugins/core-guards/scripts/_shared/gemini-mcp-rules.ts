/**
 * gemini-mcp-rules.ts — patterns + helpers for enforce-gemini-mcp, ported
 * verbatim from _legacy_py/pre-tool-use/enforce-gemini-mcp.py.
 */
import { readFileSync } from "node:fs";

export const UI_EXT = /\.(tsx|jsx|vue|svelte)$/;
export const EXEMPT_DIRS = /(node_modules|dist|build|\.next|\.codex)\//;
export const GEMINI_PREFIX = "mcp__gemini-design__";
export const MIN_TAILWIND_CLASSES = 3;
export const MIN_LINES_FOR_EDIT = 2;
export const BLOCK_MSG =
  "BLOCKED: UI code with Tailwind detected but Gemini Design MCP not used.\n"
  + "Use mcp__gemini-design__create_frontend, modify_frontend, or "
  + "snippet_frontend BEFORE writing UI code manually.\n"
  + "NEVER write Tailwind classes by hand — always use Gemini Design MCP first.";

const TAILWIND_PATTERNS = [
  /\bflex\b/, /\bgrid\b/, /\bp-\d/, /\bpx-\d/, /\bpy-\d/,
  /\bm-\d/, /\bmx-\d/, /\bmy-\d/, /\bmt-\d/, /\bmb-\d/,
  /\bbg-\w+/, /\btext-\w+/, /\brounded/, /\bshadow/,
  /\bborder\b/, /\bgap-\d/, /\bw-\w+/, /\bh-\w+/,
  /\bjustify-\w+/, /\bitems-\w+/, /\bspace-\w+-\d/,
];

/** Tool input shape for UI edits. */
export interface UiToolInput {
  command?: string;
  input?: string;
  file_path?: string;
  content?: string;
  new_string?: string;
}

/**
 * Count distinct Tailwind patterns matched in content.
 * @param content - Added source content.
 */
export function countTailwind(content: string): number {
  return TAILWIND_PATTERNS.filter((p) => p.test(content)).length;
}

/**
 * True if a Gemini Design MCP tool_use appears in the transcript JSONL.
 * @param transcriptPath - Path to the session transcript file.
 */
export function geminiWasCalled(transcriptPath: string): boolean {
  let text: string;
  try {
    text = readFileSync(transcriptPath, "utf-8");
  } catch {
    return false;
  }
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const content = JSON.parse(line.trim())?.message?.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (block?.type === "tool_use" && String(block?.name ?? "").startsWith(GEMINI_PREFIX)) return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Yield [path, contentAdded, isEdit] tuples from Claude/Codex tool input.
 * @param tool - Tool name.
 * @param ti - Tool input.
 */
export function* editsIn(tool: string, ti: UiToolInput): Generator<[string, string, boolean]> {
  if (tool === "apply_patch") {
    const body = ti.command || ti.input || "";
    let p: string | null = null, a: string | null = null, buf: string[] = [];
    for (const line of body.split(/\r?\n/)) {
      const h = line.match(/^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$/);
      if (h) {
        if (p && (a === "add" || a === "update")) yield [p, buf.join("\n"), a === "update"];
        a = h[1]!.toLowerCase(); p = h[2]!.trim(); buf = [];
      } else if ((a === "add" || a === "update") && line.startsWith("+") && !line.startsWith("+++")) {
        buf.push(line.slice(1));
      }
    }
    if (p && (a === "add" || a === "update")) yield [p, buf.join("\n"), a === "update"];
  } else {
    const fp = ti.file_path ?? "";
    const content = ti.content || ti.new_string || "";
    if (fp && content) yield [fp, content, tool === "Edit"];
  }
}
