#!/usr/bin/env bun
// @hook-entry
/**
 * validate-teammate-output.native.ts — native TS port of
 * _legacy_py/teammate-idle/validate-teammate-output.py.
 *
 * SubagentStop: when the agent's session-changes state shows code files were
 * modified, emit additionalContext suggesting sniper validation. State path,
 * field names and the message string are verbatim from the Python for parity.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { asRecord } from "../_shared/as-record";

const STATE_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "sessions");

let parsed: unknown;
try {
  parsed = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
const data = asRecord(parsed);
if (!data) process.exit(0);

const agentType = typeof data.agent_type === "string" ? data.agent_type : "unknown";
const sessionId = typeof data.session_id === "string" ? data.session_id : "unknown";
const stateFile = join(STATE_DIR, `session-${sessionId}-changes.json`);
if (!existsSync(stateFile) || !statSync(stateFile).isFile()) process.exit(0);

try {
  const state = asRecord(JSON.parse(readFileSync(stateFile, "utf-8")));
  if (!state) process.exit(0);
  const count = typeof state.cumulativeCodeFiles === "number" ? state.cumulativeCodeFiles : 0;
  if (count > 0) {
    const files = (Array.isArray(state.modifiedFiles) ? state.modifiedFiles : []).slice(0, 5).join(", ");
    console.log(JSON.stringify({
      systemMessage: `Agent '${agentType}' stopped after modifying ${count} code file(s): `
        + `${files}. Consider running sniper validation.`,
    }));
  }
} catch {
  /* JSONDecodeError/OSError → silent, mirrors python */
}
process.exit(0);
