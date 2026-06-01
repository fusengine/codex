/**
 * validate-solid-common.ts — bundle-safe TS port of the parts of
 * _shared/scripts/validate_solid_common.py used by the expert SOLID post-hooks
 * (countCodeLines, denySolidViolation). The deny JSON is byte-identical to the
 * Python so swap-in parity holds. Dependency-free for inlining.
 */

/**
 * Count non-empty, non-comment lines in content.
 * @param content - Source text.
 * @param comment - Single-line comment prefix (default "//").
 * @returns Number of significant lines.
 */
export function countCodeLines(content: string, comment = "//"): number {
  let count = 0;
  for (const line of content.split("\n")) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith(comment) || stripped.startsWith("*")) continue;
    count++;
  }
  return count;
}

/**
 * Emit a PreToolUse deny for a SOLID violation and exit (mirrors
 * deny_solid_violation). Reason string layout matches the Python exactly.
 * @param filePath - Offending file.
 * @param violations - Human-readable violation messages.
 */
export function denySolidViolation(filePath: string, violations: string[]): never {
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
