#!/usr/bin/env bun
// @hook-entry
/**
 * cleanup-old-caches.native.ts — native TS port of
 * _legacy_py/session-start/cleanup-old-caches.py.
 *
 * SessionStart: purge stale files in whitelisted ~/.claude/fusengine-cache
 * subtrees (per-dir TTL), then prune empty dirs bottom-up. Everything else is
 * preserved. Best-effort: all FS errors swallowed, always exits 0. Whitelist,
 * TTLs and the root-file skip mirror the Python exactly.
 */
import { existsSync, statSync, readdirSync, rmSync, rmdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, sep } from "node:path";

const CACHE_BASE = join(homedir(), ".claude", "fusengine-cache");
const PURGEABLE_DIRS: Record<string, number> = {
  sessions: 48 * 3600,
  webfetch: 24 * 3600,
  doc: 48 * 3600,
  explore: 48 * 3600,
};

/** TTL (seconds) for a relative path's top segment, or null if not purgeable. */
function ttlFor(relPath: string): number | null {
  const head = relPath.split(sep, 1)[0]!;
  return PURGEABLE_DIRS[head] ?? null;
}

/** Recursively yield [dirPath, fileNames] like os.walk (dirs first / top-down). */
function* walk(root: string): Generator<[string, string[]]> {
  let entries;
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return; }
  const files: string[] = [];
  const dirs: string[] = [];
  for (const e of entries) (e.isDirectory() ? dirs : files).push(e.name);
  yield [root, files];
  for (const d of dirs) yield* walk(join(root, d));
}

/** Remove whitelisted files older than their TTL; root-level files skipped. */
function purge(root: string, nowSec: number): void {
  if (!existsSync(root) || !statSync(root).isDirectory()) return;
  for (const [dirpath, files] of walk(root)) {
    const relDir = relative(root, dirpath);
    if (relDir === "" || relDir === ".") continue;
    const maxAge = ttlFor(relDir);
    if (maxAge === null) continue;
    for (const name of files) {
      const path = join(dirpath, name);
      try {
        if (nowSec - statSync(path).mtimeMs / 1000 > maxAge) rmSync(path);
      } catch { /* best-effort */ }
    }
  }
}

/** Bottom-up removal of empty subdirs within purgeable trees only. */
function pruneEmptyDirs(root: string): void {
  for (const top of Object.keys(PURGEABLE_DIRS)) {
    const subRoot = join(root, top);
    if (!existsSync(subRoot) || !statSync(subRoot).isDirectory()) continue;
    const dirs: string[] = [];
    for (const [dirpath] of walk(subRoot)) if (dirpath !== subRoot) dirs.push(dirpath);
    for (const dirpath of dirs.reverse()) {
      try { rmdirSync(dirpath); } catch { /* not empty / gone */ }
    }
  }
}

try {
  const now = Date.now() / 1000;
  purge(CACHE_BASE, now);
  pruneEmptyDirs(CACHE_BASE);
} catch { /* never block SessionStart */ }
process.exit(0);
