#!/usr/bin/env bun
// @hook-entry
/**
 * check-solid-compliance.native.ts — native TS port of
 * _legacy_py/check-solid-compliance.py.
 *
 * PostToolUse: after a Write/Edit/apply_patch to a code file, read the file on
 * disk, count code lines and check interface placement; emit a PostToolUse
 * additionalContext warning on the FIRST violating target. Reuses the shared
 * edit-targets parser; line counting + messages match the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { editTargets } from "./lib/apex/edit-targets";
import { countFileCodeLines } from "./lib/solid-lines";
import type { HookInput } from "./lib/interfaces/hook.interface";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|php|swift|go|rs|rb|java|astro)$/;

/** Read a file, returning "" on failure. */
function readOrEmpty(fp: string): string {
  try {
    return readFileSync(fp, "utf8");
  } catch {
    return "";
  }
}

let data: HookInput;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

for (const target of editTargets(data)) {
  const fp = target.filePath;
  if (!CODE_EXT.test(fp) || !existsSync(fp)) continue;

  const violations: string[] = [];
  const lc = countFileCodeLines(fp);
  if (lc > 100) violations.push(`FILE SIZE: ${lc} lines (max: 100)`);
  else if (lc > 90) violations.push(`FILE SIZE WARNING: ${lc} lines (split at 90)`);

  if (/(components|pages|views)\//.test(fp)) {
    if (/^(export )?(interface|type) [A-Z]/m.test(readOrEmpty(fp))) {
      violations.push("INTERFACE LOCATION: Move to src/interfaces/");
    }
  } else if (/(Controllers|Models|Services)\//.test(fp)) {
    if (/^interface /m.test(readOrEmpty(fp))) {
      violations.push("INTERFACE LOCATION: Move to app/Contracts/");
    }
  }

  if (!violations.length) continue;

  const name = basename(fp);
  console.error(`solid: violations in ${name}`);
  const content = `SOLID COMPLIANCE CHECK: ${name}\n\n${violations.join("\n")}`
    + "\nINSTRUCTION: Fix violations before continuing."
    + "\nRun sniper agent for full validation.";
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: content },
  }));
  process.exit(0);
}
process.exit(0);
