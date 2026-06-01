/**
 * safe-paths.ts — bundle-safe TS port of _shared/scripts/safe_paths.py.
 * Resolves and validates "safe" write targets (the internal plugin cache) for
 * the bash-write-guard hook. Regexes and path logic are verbatim for parity.
 */
import { homedir } from "node:os";
import { join, normalize } from "node:path";

/** CODEX_HOME or default ~/.codex, mirroring os.environ.get fallback. */
function codexHome(): string {
  return process.env.CODEX_HOME || join(homedir(), ".codex");
}

/** Paths where writes are always allowed (normalised). */
const SAFE_WRITE_PATHS = [
  normalize(join(codexHome(), "fusengine")),
  normalize(join(codexHome(), "fusengine", "logs")),
];

/** Raw ~ forms accepted before expansion. */
const SAFE_RAW = ["~/.codex/fusengine", "~/.codex/fusengine/logs"];

/**
 * True if the command string mentions a safe write path (expanded or raw ~).
 * @param cmd - Raw shell command.
 */
export function hasSafeWriteTarget(cmd: string): boolean {
  return SAFE_WRITE_PATHS.some((s) => cmd.includes(s)) || SAFE_RAW.some((r) => cmd.includes(r));
}

/**
 * Resolve ~, $HOME, %USERPROFILE% and normalise separators.
 * @param path - Raw path token.
 */
export function resolvePath(path: string): string {
  let p = path.trim().replace(/^['"]+|['"]+$/g, "");
  if (p === "~" || p.startsWith("~/")) p = join(homedir(), p.slice(1));
  p = p.replace(/\$(\w+)|\$\{(\w+)\}|%(\w+)%/g, (_m, a, b, c) => {
    const key = a || b || c;
    return process.env[key] ?? _m;
  });
  return normalize(p);
}

/**
 * Extract the file path after a > or >> redirect operator.
 * @param cmd - Raw shell command.
 * @returns Resolved target path or null.
 */
export function extractRedirectTarget(cmd: string): string | null {
  const match = cmd.match(/>>\s*(\S+)|(?<![2&\d])>\s*(\S+)/);
  if (match) return resolvePath(match[1] || match[2]!);
  return null;
}

/**
 * True if a redirect target points to an allowed write path.
 * @param cmd - Raw shell command.
 */
export function isSafeWritePath(cmd: string): boolean {
  const target = extractRedirectTarget(cmd);
  if (!target) return false;
  return SAFE_WRITE_PATHS.some((s) => target.startsWith(s));
}

/**
 * Extract the file path argument from tee/dd commands.
 * @param cmd - Raw shell command.
 * @returns Resolved target path or null.
 */
export function extractCommandTarget(cmd: string): string | null {
  const tee = cmd.match(/\btee\s+(?:-[a-z]\s+)*(\S+)/);
  if (tee) return resolvePath(tee[1]!);
  const dd = cmd.match(/\bdd\b[^|]*\bof=(\S+)/);
  if (dd) return resolvePath(dd[1]!);
  return null;
}

/**
 * True if a tee/dd target points to an allowed write path.
 * @param cmd - Raw shell command.
 */
export function isSafeCommandTarget(cmd: string): boolean {
  const target = extractCommandTarget(cmd);
  if (!target) return false;
  return SAFE_WRITE_PATHS.some((s) => target.startsWith(s));
}
