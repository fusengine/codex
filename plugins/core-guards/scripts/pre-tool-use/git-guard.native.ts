#!/usr/bin/env bun
// @hook-entry
// superseded by @fusengine/harness hook codex (2026-07-06) — removed from core-guards/hooks/hooks.json; kept until owner confirms removal
/**
 * git-guard.native.ts — native TS port of _legacy_py/pre-tool-use/git-guard.py.
 *
 * PreToolUse(any tool with a command): block destructive git commands (deny),
 * ask for other mutating git commands. In Ralph mode, RALPH_SAFE commands pass.
 * BLOCKED patterns use regex search; ASK patterns use substring — exactly like
 * the Python. Reason strings (prefixed "GIT GUARD: ") match for parity.
 */
import { isRalphMode } from "../_shared/ralph-mode";
import { RALPH_SAFE, BLOCKED_GIT, ASK_GIT } from "../_shared/guard-patterns";
import { normalizeCommand } from "../_shared/normalize-command";

interface ToolInput { command?: unknown; }

/** Emit the PreToolUse decision JSON and exit. */
function outputDecision(decision: string, reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: `GIT GUARD: ${reason}`,
    },
  }));
  process.exit(0);
}

let data: { tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const cmd = normalizeCommand(data.tool_input?.command);
if (!cmd) process.exit(0);

if (isRalphMode()) {
  for (const safe of RALPH_SAFE) {
    if (cmd.startsWith(safe)) process.exit(0);
  }
}
for (const pat of BLOCKED_GIT) {
  if (new RegExp(pat).test(cmd)) outputDecision("deny", `Destructive command '${pat}' BLOCKED`);
}
for (const pat of ASK_GIT) {
  if (cmd.includes(pat)) outputDecision("ask", `'${pat}' detected. Authorize?`);
}
process.exit(0);
