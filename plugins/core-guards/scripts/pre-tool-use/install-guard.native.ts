#!/usr/bin/env bun
// @hook-entry
/**
 * install-guard.native.ts — native TS port of
 * _legacy_py/pre-tool-use/install-guard.py.
 *
 * PreToolUse(Bash): ask before system installs (always) and project-dependency
 * installs (unless Ralph mode). Substring matching and reason strings match the
 * Python for parity.
 */
import { isRalphMode } from "../_shared/ralph-mode";
import { SYSTEM_INSTALL, PROJECT_INSTALL } from "../_shared/guard-patterns";

interface ToolInput { command?: string; }

/** Emit an ask decision JSON and exit. */
function outputAsk(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

let data: { tool_name?: string; tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "";
const cmd = data.tool_input?.command ?? "";
if (tool !== "Bash" || !cmd) process.exit(0);

for (const pat of SYSTEM_INSTALL) {
  if (cmd.includes(pat)) outputAsk(`SYSTEM INSTALL: '${pat}' requires confirmation`);
}
for (const pat of PROJECT_INSTALL) {
  if (cmd.includes(pat)) {
    if (isRalphMode()) process.exit(0);
    outputAsk(`INSTALL GUARD: '${pat}' detected. Authorize?`);
  }
}
process.exit(0);
