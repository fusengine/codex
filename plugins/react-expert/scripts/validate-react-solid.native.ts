#!/usr/bin/env bun
// @hook-entry
/**
 * validate-react-solid.native.ts — native TS port of
 * _legacy_py/validate-react-solid.py.
 *
 * PreToolUse SOLID validation for React edits: >100 code lines, interface/type
 * inside components/, custom hook outside hooks/. Next.js code is skipped.
 * Reuses the content-based countCodeLines (//, * — no #, matching the Python
 * count_code_lines). Deny JSON uses the wired PreToolUse event.
 */
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { countCodeLines } from "../../core-guards/scripts/_shared/validate-solid-common";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { isReactProject } from "../../core-guards/scripts/_shared/stack-detect";

const FILE_RE = /\.(tsx|ts|jsx|js)$/;
const SKIP_RE = /\/(node_modules|dist|build)\//;
const NEXTJS_RE = /(use client|use server|NextRequest|NextResponse|from ['"]next)/;

/** Emit a PreToolUse deny for a SOLID violation and exit. */
function denySolidViolation(filePath: string, violations: string[]): never {
  const reason = `SOLID VIOLATION in ${filePath}: ` + violations.join(" ");
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

let data: { tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

// Stack gate: only run React SOLID checks in an actual React (non-Next) project, so a plain
// JS or other-stack project never scans its .ts/.tsx edits here (Next.js has its own validators).
if (!isReactProject()) process.exit(0);

for (const target of editTargets(data)) {
  const filePath = target.filePath;
  if (!FILE_RE.test(filePath) || SKIP_RE.test(filePath)) continue;
  const content = target.content;
  if (NEXTJS_RE.test(content)) continue;
  if (!content) continue;

  const lineCount = countCodeLines(content);
  const violations: string[] = [];
  if (lineCount > 100) {
    violations.push(`File has ${lineCount} lines (limit: 100). Split to hooks/, components/, or utils/.`);
  }
  if (filePath.includes("/components/") && /^(export )?(interface|type) [A-Z]/m.test(content)) {
    violations.push("Interface/type in component. Move to src/interfaces/ or src/types/.");
  }
  if (/^export (function|const) use[A-Z]/m.test(content) && !filePath.includes("/hooks/")) {
    violations.push("Custom hook defined outside hooks/ directory. Move to hooks/.");
  }
  if (violations.length) denySolidViolation(filePath, violations);
}
allowPass("validate-react-solid", "SOLID ok");
