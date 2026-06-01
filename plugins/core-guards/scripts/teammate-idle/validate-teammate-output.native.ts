#!/usr/bin/env bun
// @hook-entry
/**
 * validate-teammate-output.native.ts — native TS port of
 * _legacy_py/teammate-idle/validate-teammate-output.py.
 *
 * TeammateIdle: when the teammate's session-changes state shows code files were
 * modified, emit additionalContext suggesting sniper validation. State path,
 * field names and the message string are verbatim from the Python for parity.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const STATE_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "sessions");

let data: { teammate_name?: string; session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const teammateName = data.teammate_name ?? "unknown";
const sessionId = data.session_id ?? "unknown";
const stateFile = join(STATE_DIR, `session-${sessionId}-changes.json`);
if (!existsSync(stateFile) || !statSync(stateFile).isFile()) process.exit(0);

try {
  const state = JSON.parse(readFileSync(stateFile, "utf-8"));
  const count = state.cumulativeCodeFiles ?? 0;
  if (count > 0) {
    const files = (Array.isArray(state.modifiedFiles) ? state.modifiedFiles : []).slice(0, 5).join(", ");
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "TeammateIdle",
        additionalContext: `Teammate '${teammateName}' going idle after modifying `
          + `${count} code file(s): ${files}. Consider running sniper validation.`,
      },
    }));
  }
} catch {
  /* JSONDecodeError/OSError → silent, mirrors python */
}
process.exit(0);
