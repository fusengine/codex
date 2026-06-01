#!/usr/bin/env bun
// @hook-entry
/**
 * enforce-gemini-mcp.native.ts — native TS port of
 * _legacy_py/pre-tool-use/enforce-gemini-mcp.py.
 *
 * PreToolUse: deny UI code with >=3 Tailwind classes unless a Gemini Design MCP
 * tool was used this session (scanned from the transcript). Logic and the block
 * message are verbatim from the Python for strict parity.
 */
import {
  UI_EXT, EXEMPT_DIRS, MIN_TAILWIND_CLASSES, MIN_LINES_FOR_EDIT, BLOCK_MSG,
  countTailwind, geminiWasCalled, editsIn, type UiToolInput,
} from "../_shared/gemini-mcp-rules";

let data: { agent_id?: string; transcript_path?: string; tool_name?: string; tool_input?: UiToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
if (data.agent_id) process.exit(0);

const transcript = data.transcript_path ?? "";
for (const [fp, content, isEdit] of editsIn(data.tool_name ?? "", data.tool_input ?? {})) {
  if (!UI_EXT.test(fp) || EXEMPT_DIRS.test(fp)) continue;
  if (isEdit && (content.split("\n").length - 1) < MIN_LINES_FOR_EDIT) continue;
  if (countTailwind(content) < MIN_TAILWIND_CLASSES) continue;
  if (transcript && geminiWasCalled(transcript)) continue;
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: BLOCK_MSG },
  }));
  process.exit(0);
}
process.exit(0);
