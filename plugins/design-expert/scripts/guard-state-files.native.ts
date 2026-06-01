#!/usr/bin/env bun
// @hook-entry
/**
 * guard-state-files.native.ts — native TS port of _legacy_py/guard-state-files.py.
 *
 * PreToolUse: when the active design agent tries to edit a .design-state-* file,
 * deny (those files are hook-managed, read-only for the agent). No-op unless the
 * flag is set and the agent matches. Deny message matches the Python.
 */
import { gatedAgentId } from "./lib/design-state";

let data: { agent_id?: string; tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (gatedAgentId(data.agent_id ?? "") === null) process.exit(0);

const fp = data.tool_input?.file_path ?? "";
if (fp.includes(".design-state-")) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        "BLOCKED: .design-state files are READ-ONLY for you. "
        + "Hooks update them automatically as you progress. "
        + "Do NOT try to modify them — it will not unblock you. "
        + "Follow the pipeline: Phase 0→1→2→3→4→5→6 in order.",
    },
  }));
  process.exit(0);
}
process.exit(0);
