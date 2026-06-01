/**
 * track-fs-cleanup.ts — mtime-based file pruning + log trimming helpers shared
 * by the session lifecycle cleanup hooks. Ports the glob/getmtime/remove and
 * log-trim logic from _legacy_py/session-start/cleanup-session-states.py and
 * session-end/cleanup-session.py. Bundle-safe (no import.meta.path).
 */
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Current mtime in seconds, or null when the path is unreadable. */
function mtimeSec(path: string): number | null {
  try { return statSync(path).mtimeMs / 1000; } catch { return null; }
}

/**
 * Remove files in *dir* matching the `<prefix>*<suffix>` glob (a single `*`)
 * whose mtime is older than *maxAgeSec*. No-op when *dir* is not a directory.
 *
 * @param dir - Directory to scan (non-recursive, mirrors glob.glob).
 * @param pattern - Glob with exactly one `*` wildcard (e.g. "session-*.json").
 * @param maxAgeSec - Age threshold in seconds.
 */
export function cleanupOldFiles(dir: string, pattern: string, maxAgeSec: number): void {
  let isDir = false;
  try { isDir = statSync(dir).isDirectory(); } catch { isDir = false; }
  if (!isDir) return;
  const star = pattern.indexOf("*");
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  const now = Date.now() / 1000;
  let names: string[];
  try { names = readdirSync(dir); } catch { return; }
  for (const name of names) {
    if (!name.startsWith(prefix) || !name.endsWith(suffix)) continue;
    if (name.length < prefix.length + suffix.length) continue;
    const full = join(dir, name);
    const m = mtimeSec(full);
    if (m === null) continue;
    if (now - m > maxAgeSec) {
      try { unlinkSync(full); } catch { /* ignore */ }
    }
  }
}

/**
 * Trim *logFile* to its last *keepLines* lines when it exceeds *maxBytes*.
 *
 * @param logFile - Path to the log file.
 * @param maxBytes - Size threshold above which trimming occurs.
 * @param keepLines - Number of trailing lines to retain.
 */
export function trimLogFile(logFile: string, maxBytes: number, keepLines: number): void {
  if (!existsSync(logFile)) return;
  try {
    if (statSync(logFile).size <= maxBytes) return;
    const lines = readFileSync(logFile, "utf-8").split(/(?<=\n)/);
    writeFileSync(logFile, lines.slice(-keepLines).join(""), "utf-8");
  } catch { /* ignore */ }
}
