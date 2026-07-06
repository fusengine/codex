#!/usr/bin/env bun
// @hook-entry
// superseded by @fusengine/harness hook codex (2026-07-06) — removed from core-guards/hooks/hooks.json; kept until owner confirms removal
/**
 * bash-write-guard.native.ts — native TS port of
 * _legacy_py/pre-tool-use/bash-write-guard.py.
 *
 * PreToolUse(Bash): block shell file-writes that bypass Edit/Write (and the
 * gated apply_patch tool). Branch order, regexes and reason strings (prefixed
 * "BASH WRITE GUARD: ") are verbatim from the Python for strict parity.
 */
import { isSafeWritePath, isSafeCommandTarget, hasSafeWriteTarget, extractRedirectTarget } from "../_shared/safe-paths";
import { CODE_EXT, SAFE_PREFIXES, DENY_PATTERNS, ASK_PATTERNS, hasFileRedirect, INLINE_INTERPRETER, INLINE_WRITES } from "../_shared/bash-write-patterns";

interface ToolInput { command?: string; }

/** Emit the PreToolUse decision JSON and exit. */
function out(decision: string, reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: `BASH WRITE GUARD: ${reason}`,
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
const cmd = data.tool_input?.command ?? "";
if (!cmd) process.exit(0);

if (/\bapply_patch\b/.test(cmd) || (/\bgit\s+apply\b/.test(cmd) && !/--(check|stat|numstat|summary)\b/.test(cmd))) {
  out("deny", "apply_patch/git apply via shell bypasses the gated apply_patch tool — use the tool");
}
// Interpreter running INLINE code that writes files (heredoc / -e / -c / eval / stdin):
// e.g. `node <<'EOF' ... writeFileSync ... EOF`, `bun -e`, `deno eval`, `python3 <<PY`.
// Checked FIRST — before SAFE_PREFIXES or `;`/`&&` chaining can short-circuit — since
// the write primitive only appears in the command text when code is inlined.
if (INLINE_INTERPRETER.test(cmd) && INLINE_WRITES.test(cmd)) {
  if (hasSafeWriteTarget(cmd)) process.exit(0);
  out("deny", "Interpreter inline file-write (heredoc or -e/-c/eval) bypasses apply_patch/Write/Edit — use Write/Edit");
}
const stripped = cmd.trim();
if (SAFE_PREFIXES.some((p) => stripped.startsWith(p)) && !hasFileRedirect(stripped)) process.exit(0);
if (cmd.includes("context/mcp/") || cmd.includes("fusengine/sessions")) {
  if (hasFileRedirect(cmd) || /\bsed\b[^|]*\s-i|\b(rm|mv|cp|tee|truncate|dd|chmod|chown)\b/.test(cmd)) {
    out("deny", "Session/cache state mutation — Use Edit/Write tools instead");
  }
  process.exit(0);
}
for (const [pattern, desc] of DENY_PATTERNS) {
  if (pattern.test(cmd)) out("deny", `${desc} — Use Edit/Write tools instead`);
}
if (hasFileRedirect(cmd)) {
  if (isSafeWritePath(cmd)) process.exit(0);
  const target = extractRedirectTarget(cmd) ?? "";
  if (CODE_EXT.test(target)) out("deny", "Bash redirect to code file — Use Write/Edit tools (enforces APEX + SOLID specs)");
  out("ask", "Shell redirect to file detected. Authorize?");
}
for (const [pattern, desc] of ASK_PATTERNS) {
  if (pattern.test(cmd)) {
    if (isSafeCommandTarget(cmd)) process.exit(0);
    out("ask", `${desc} detected. Authorize?`);
  }
}
process.exit(0);
