#!/usr/bin/env bun
// @hook-entry
// superseded by @fusengine/harness hook codex (2026-07-06) — removed from core-guards/hooks/hooks.json; kept until owner confirms removal
/**
 * security-guard.native.ts — native TS port of
 * _legacy_py/pre-tool-use/security-guard.py.
 *
 * PreToolUse(Bash): validate the command against security rules; deny on
 * critical/dangerous/privilege violations, ask otherwise. Decision + reason
 * strings (prefixed "SECURITY: ") are identical to the Python for parity.
 */
import { validateCommand } from "../_shared/security-rules";
import { normalizeCommand } from "../_shared/normalize-command";

interface ToolInput { command?: unknown; }

/** Emit the PreToolUse decision JSON and exit. */
function outputDecision(decision: string, reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: `SECURITY: ${reason}`,
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

if (data.tool_name !== "Bash") process.exit(0);
const cmd = normalizeCommand(data.tool_input?.command);
if (!cmd) process.exit(0);

const [isValid, violations] = validateCommand(cmd);
if (!isValid) {
  const hasCritical = violations.some(
    (v) => v.includes("CRITICAL") || v.includes("DANGEROUS PATTERN") || v.includes("PRIVILEGE ESCALATION"),
  );
  outputDecision(hasCritical ? "deny" : "ask", violations.join(", "));
}
process.exit(0);
