#!/usr/bin/env bun
// @hook-entry
/**
 * detect-bash-write.native.ts — native TS port of _legacy_py/detect-bash-write.py.
 *
 * Blocks Bash commands that WRITE to a code file (`> x.ts`, `>> x.ts`,
 * `tee x.ts`, heredoc into a code file) so edits go through Write/Edit which
 * enforce the APEX/SOLID workflow. Pure reads, fd redirects (`2>`, `&>`),
 * `>/dev/null` and a `>` inside a quoted string are NOT blocked. Detection
 * regexes and deny JSON are identical to the Python.
 */
const CODE_EXT = "(?:ts|tsx|js|jsx|py|php|swift|go|rs|rb|java|vue|svelte|astro|css)";
const REDIRECT_TO_CODE = new RegExp(`(?<![0-9&>])>>?\\s*(?!/dev/null)['"]?[\\w./~$-]+\\.${CODE_EXT}\\b`);
const TEE_TO_CODE = new RegExp(`\\btee\\b(?:\\s+-\\S+)*\\s+['"]?[\\w./~$-]+\\.${CODE_EXT}\\b`);

/** Interpreter executing INLINE code (heredoc / -e / -c / eval) that writes a file. */
const INLINE_INTERPRETER = /\b(?:node|bun|deno|ts-node|tsx|python3?|ruby|php|perl)\b/;
const INLINE_WRITE = /writeFileSync|appendFileSync|writeFile\s*\(|createWriteStream|\.write_text\s*\(|\.write_bytes\s*\(|open\s*\([^)]*['"][wax]\+?b?['"]|file_put_contents|File\.(?:write|open)\b|IO\.write/;

const DENY_REASON =
  "APEX BYPASS BLOCKED: Use Write tool instead of Bash to write code files. "
  + "Write tool enforces APEX/SOLID documentation requirements.";

/** Blank out quoted spans so a `>` inside a string literal is not a redirect. */
function stripQuoted(cmd: string): string {
  const out: string[] = [];
  let quote: string | null = null;
  for (const ch of cmd) {
    if (quote) {
      out.push(" ");
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out.push(" ");
    } else {
      out.push(ch);
    }
  }
  return out.join("");
}

/** True when the command redirects/tees output into a code file, or runs an
 * interpreter with inline source (heredoc / -e / -c / eval) that writes a file. */
function writesCodeFile(command: string): boolean {
  const clean = stripQuoted(command);
  if (REDIRECT_TO_CODE.test(clean) || TEE_TO_CODE.test(clean)) return true;
  // Scan the RAW command: an inline write may live inside a quoted -e string,
  // which stripQuoted() would blank out.
  return INLINE_INTERPRETER.test(command) && INLINE_WRITE.test(command);
}

let event: { tool_name?: string; tool_input?: { command?: string } };
try {
  event = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (event.tool_name !== "Bash" && event.tool_name !== "bash") process.exit(0);

const command = event.tool_input?.command ?? "";
if (command && writesCodeFile(command)) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: DENY_REASON,
    },
  }));
}
process.exit(0);
