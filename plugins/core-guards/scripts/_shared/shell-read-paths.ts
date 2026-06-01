/**
 * shell-read-paths.ts — bundle-safe TS port of _shared/scripts/shell_read_paths.py.
 *
 * Extracts a skill doc path from a Read payload or a shell read command
 * (cat/sed/head/... skills/foo.md). Mirrors the Python shlex.split + DOC_RE so
 * the post-hooks track the same files. Dependency-free for inlining.
 */
import { isAbsolute, join, resolve, basename } from "node:path";

const READ_TOOLS = new Set(["Read"]);
const SHELL_TOOLS = new Set(["Bash", "Shell", "exec_command"]);
const READ_COMMANDS = new Set(["bat", "cat", "grep", "head", "less", "nl", "rg", "sed", "tail"]);
const DOC_RE = /(^|\/)skills\/.+\.(md|txt)$/;

interface Payload {
  tool_name?: string;
  cwd?: string;
  tool_input?: { file_path?: string; command?: string; cwd?: string };
}

/** Minimal POSIX-style tokenizer (quotes + backslash) mirroring shlex.split. */
function shlexSplit(command: string): string[] | null {
  const tokens: string[] = [];
  let cur = "";
  let quote = "";
  let has = false;
  for (let i = 0; i < command.length; i++) {
    const c = command[i]!;
    if (quote) {
      if (c === quote) quote = "";
      else if (c === "\\" && quote === '"') cur += command[++i] ?? "";
      else cur += c;
    } else if (c === "'" || c === '"') {
      quote = c;
      has = true;
    } else if (c === "\\") {
      cur += command[++i] ?? "";
      has = true;
    } else if (/\s/.test(c)) {
      if (has) { tokens.push(cur); cur = ""; has = false; }
    } else {
      cur += c;
      has = true;
    }
  }
  if (quote) return null; // unbalanced quote → shlex ValueError
  if (has) tokens.push(cur);
  return tokens;
}

/** Strip surrounding quotes/whitespace from a token (mirrors _clean_token). */
function cleanToken(token: string): string {
  return token.trim().replace(/^['"]+|['"]+$/g, "");
}

/** Skill doc paths in a read command (cat/sed/... skills/x.md); [] otherwise. */
function candidatePaths(command: string): string[] {
  const tokens = shlexSplit(command);
  if (!tokens || !tokens.length || !READ_COMMANDS.has(basename(tokens[0]!))) return [];
  return tokens.slice(1).map(cleanToken).filter((t) => DOC_RE.test(t));
}

/** Resolve a relative path against cwd (mirrors os.path.abspath). */
function resolvePath(path: string, cwd: string): string {
  if (!path || isAbsolute(path)) return path;
  return resolve(join(cwd || process.cwd(), path));
}

/**
 * Return a skill doc path from a Read or shell-read hook payload.
 * @param data - Parsed hook event payload.
 * @returns Skill doc path, or "" when none applies.
 */
export function skillDocPathFromPayload(data: Payload): string {
  const ti = data.tool_input ?? {};
  if (READ_TOOLS.has(data.tool_name ?? "")) return ti.file_path ?? "";
  if (!SHELL_TOOLS.has(data.tool_name ?? "")) return "";
  const command = String(ti.command ?? "");
  const cwd = String(data.cwd ?? ti.cwd ?? "");
  for (const path of candidatePaths(command)) return resolvePath(path, cwd);
  return "";
}
