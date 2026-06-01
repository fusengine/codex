/**
 * bash-write-patterns.ts — pattern data + helpers for bash-write-guard, ported
 * verbatim from _legacy_py/pre-tool-use/bash-write-guard.py.
 */

/** Code-file extension probe (mirrors CODE_EXT, uses \b like the Python). */
export const CODE_EXT = /\.(ts|tsx|js|jsx|py|php|swift|go|rs|rb|java|vue|svelte|astro|css)\b/;

/** Command prefixes considered read-only/safe (verbatim list). */
export const SAFE_PREFIXES = [
  "ls", "pwd", "which", "cat ", "head ", "tail ", "wc ", "file ", "stat ", "tree", "du ", "df ",
  "find ", "grep ", "rg ", "git ", "cd ", "source ", "export ", "unset ", "env ", "printenv",
  "bun test", "bun run", "bunx ", "npm test", "npm run", "npx ", "biome ", "eslint ",
  "prettier ", "ruff ", "pyright ", "tsc ", "mkdir ", "mv ", "cp ",
];

/** Deny patterns: [regex, description]. Sources verbatim from Python. */
export const DENY_PATTERNS: [RegExp, string][] = [
  [/python3?\s+-\s*<</, "Python heredoc input"],
  [/python3?\s+-c\s/, "Python inline script"],
  [/\bsed\b[^|]*\s-i/, "sed in-place edit"],
  [/\bperl\b[^|]*\s-\w*i/, "perl in-place edit"],
  [/\bawk\b[^|]*-i\s*inplace/, "awk in-place edit"],
  [/\bpatch\b/, "patch file modification"],
];

/** Node/Ruby write-call probes (verbatim). */
export const NODE_WRITES = /writeFile|appendFile|createWriteStream|fs\.(write|rename|unlink|mkdir|rmdir|copyFile)|execSync|spawnSync|child_process/;
export const RUBY_WRITES = /File\.(write|open|delete|rename)|IO\.write|FileUtils|\bsystem\b|\bexec\b|`[^`]/;

/** Ask patterns: [regex, description]. */
export const ASK_PATTERNS: [RegExp, string][] = [
  [/\btee\s+[^-/\s]/, "tee to file"],
  [/\bdd\b[^|]*\bof=/, "dd output to file"],
];

/**
 * Detect shell output redirections to files (not /dev/null or &).
 * @param cmd - Raw shell command.
 */
export function hasFileRedirect(cmd: string): boolean {
  return /(?<![2&\d])\s*>>?\s*(?!\/dev\/null|&)[a-zA-Z./~$]/.test(cmd);
}
