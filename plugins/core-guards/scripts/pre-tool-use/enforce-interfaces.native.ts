#!/usr/bin/env bun
// @hook-entry
/**
 * enforce-interfaces.native.ts — native TS port of
 * _legacy_py/pre-tool-use/enforce-interfaces.py.
 *
 * PreToolUse: deny writes that declare contracts (interfaces/types/protocols)
 * inside implementation files. RULES, V4A parsing and reason strings are
 * verbatim from the Python for strict parity.
 */
import { contractViolation } from "../_shared/interface-rules";
import { emitPreTool } from "../_shared/hook-output";

interface ToolInput { command?: string; input?: string; patch?: string; file_path?: string; content?: string; new_string?: string; }

/** [pathPattern, contentPattern, message] rules (regex sources verbatim). */
const RULES: [RegExp, RegExp, string][] = [
  [/\.(tsx|jsx|vue|svelte)$/, /^(export )?(interface|type) [A-Z]/, "Interface/type in component file. Move to src/interfaces/"],
  [/(views?|controllers?|routes?)\/.*\.py$/, /^class [A-Z].*(BaseModel|TypedDict|Protocol)/, "Type class in view file. Move to src/interfaces/"],
  [/(handlers?|controllers?)\/.*\.go$/, /^type [A-Z].*interface/, "Interface in handler file. Move to internal/interfaces/"],
  [/(controllers?|handlers?)\/.*\.(java|kt)$/, /^(public |private )?(interface|record) [A-Z]/, "Interface in controller file. Move to interfaces/ package"],
  [/(Controllers?|Handlers?)\/.*\.php$/, /^(interface|class) [A-Z].*(Interface|DTO|Request)/, "Interface in controller file. Move to Interfaces/ directory"],
  [/(Views?|Components?)\/.*\.swift$/, /^protocol [A-Z]/, "Protocol in view file. Move to Protocols/ or Models/"],
];

/** Yield [path, addedText] from a V4A body (skips Delete files). */
function* parseV4a(body: string): Generator<[string, string]> {
  let p: string | null = null, a: string | null = null, buf: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^\*\*\*\s+(Add|Update|Delete) File:\s+(.+)$/);
    if (h) {
      if (p && a !== "delete") yield [p, buf.join("\n")];
      a = h[1]!.toLowerCase(); p = h[2]!.trim(); buf = [];
    } else if ((a === "add" || a === "update") && line.startsWith("+") && !line.startsWith("+++")) {
      buf.push(line.slice(1));
    }
  }
  if (p && a !== "delete") yield [p, buf.join("\n")];
}

/** Build a SOLID-violation reason for a file/content, or null. */
function deny(fp: string, content: string): string | null {
  const reason = contractViolation(fp, content);
  if (reason) return `SOLID VIOLATION (${fp}): ${reason}`;
  for (const [pathPat, contentPat, msg] of RULES) {
    if (!pathPat.test(fp)) continue;
    for (const line of content.split(/\r?\n/)) {
      if (contentPat.test(line)) return `SOLID VIOLATION (${fp}): ${msg}`;
    }
  }
  return null;
}

let data: { tool_name?: string; tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
const tool = data.tool_name ?? "";
const ti = data.tool_input ?? {};
const reasons: string[] = [];
if (tool === "apply_patch") {
  const body = ti.command || ti.input || ti.patch || "";
  for (const [path, added] of parseV4a(body)) {
    const r = deny(path, added);
    if (r) reasons.push(r);
  }
} else {
  const fp = ti.file_path ?? "";
  const content = ti.content || ti.new_string || "";
  if (fp && content) {
    const r = deny(fp, content);
    if (r) reasons.push(r);
  }
}
if (reasons.length) emitPreTool("deny", reasons.join(" | "), { scriptName: "enforce-interfaces" });
process.exit(0);
