/**
 * track-shell.ts — minimal POSIX shell tokenizer + executable extractor.
 *
 * Ports the `shlex.split(cmd, posix=True)` + first-non-assignment-token logic
 * from _legacy_py/post-tool-use/track-subagent-research.py so the native hook
 * classifies Bash exploration commands identically. On a tokenizing error
 * (unbalanced quotes) shlex raises ValueError → we return "".
 */

/**
 * POSIX-split *cmd* into tokens, honoring single/double quotes and backslash
 * escapes. Returns null on an unbalanced quote (mirrors shlex ValueError).
 *
 * @param cmd - Raw shell command line.
 * @returns Token list, or null when quoting is unbalanced.
 */
function shlexSplit(cmd: string): string[] | null {
  const tokens: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  const n = cmd.length;
  while (i < n) {
    const c = cmd[i];
    if (c === "'") {
      has = true;
      i++;
      while (i < n && cmd[i] !== "'") cur += cmd[i++];
      if (i >= n) return null;
      i++;
    } else if (c === '"') {
      has = true;
      i++;
      while (i < n && cmd[i] !== '"') {
        if (cmd[i] === "\\" && i + 1 < n && '"\\$`\n'.includes(cmd[i + 1])) i++;
        cur += cmd[i++];
      }
      if (i >= n) return null;
      i++;
    } else if (c === "\\") {
      has = true;
      if (i + 1 < n) cur += cmd[++i];
      i++;
    } else if (c === " " || c === "\t" || c === "\n") {
      if (has) { tokens.push(cur); cur = ""; has = false; }
      i++;
    } else {
      has = true;
      cur += c;
      i++;
    }
  }
  if (has) tokens.push(cur);
  return tokens;
}

/**
 * Return the basename of the first non-assignment token of *cmd*, or "".
 *
 * @param cmd - Raw shell command line.
 * @returns Executable basename, or "" on empty input / tokenizer error.
 */
export function bashExecutable(cmd: string): string {
  if (!cmd) return "";
  const tokens = shlexSplit(cmd);
  if (tokens === null) return "";
  for (const token of tokens) {
    const last = token.split("/").pop() ?? "";
    if (!last.includes("=")) {
      const parts = token.split("/");
      return parts[parts.length - 1];
    }
  }
  return "";
}
