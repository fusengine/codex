#!/usr/bin/env bun
// @hook-entry
/**
 * check-file-size.native.ts — native TS port of _legacy_py/check-file-size.py.
 *
 * PostToolUse: count non-comment/non-blank LOC of each edited file and emit a
 * SOLID warning (first offender only) when it exceeds SOLID_FILE_LIMIT. The
 * per-extension comment regexes, the limit env, the message and the early break
 * are verbatim from the Python. Edit targets reuse the shared editTargets.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { extname, basename } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import type { HookInput } from "../../ai-pilot/scripts/lib/interfaces/hook.interface";

const C_LIKE = /^\s*$|^\s*\/\/|^\s*\/\*|^\s*\*/;
const COMMENT: Record<string, RegExp> = {
  ts: C_LIKE, tsx: C_LIKE, js: C_LIKE, jsx: C_LIKE, go: C_LIKE, rs: C_LIKE,
  java: C_LIKE, swift: C_LIKE,
  php: /^\s*$|^\s*\/\/|^\s*#|^\s*\/\*|^\s*\*/,
  py: /^\s*$|^\s*#|^\s*"""|^\s*'''/,
};

/** Count code lines (excluding blanks/comments) for a file, 0 on read error. */
function countLoc(filePath: string): number {
  const ext = extname(filePath).replace(/^\./, "");
  let lines: string[];
  try {
    lines = readFileSync(filePath, "utf-8").split("\n");
  } catch {
    return 0;
  }
  // Python readlines() keeps no trailing empty element; drop a trailing "".
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  const pattern = COMMENT[ext];
  if (pattern) return lines.filter((l) => !pattern.test(l)).length;
  return lines.length;
}

const ptype = process.env.SOLID_PROJECT_TYPE ?? "";
if (!ptype || ptype === "unknown") process.exit(0);

let data: HookInput;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const limit = Number.parseInt(process.env.SOLID_FILE_LIMIT ?? "100", 10);
for (const t of editTargets(data)) {
  const fp = t.filePath;
  if (!fp || !existsSync(fp) || !statSync(fp).isFile()) continue;
  const loc = countLoc(fp);
  if (loc > limit) {
    const reason = `SOLID: ${basename(fp)} has ${loc} lines (limit: ${limit}).`
      + " Consider splitting into smaller modules.";
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: reason },
    }));
    break;
  }
}
process.exit(0);
