#!/usr/bin/env bun
// @hook-entry
/**
 * cleanup-session-states.native.ts — native TS port of
 * _legacy_py/session-start/cleanup-session-states.py.
 *
 * SessionStart: prune stale session-*.json (>24h), the per-user changes file
 * (>6h), stale apex ref-cache (>24h), and trim hooks.log to 5000 lines when
 * it exceeds 10MB. Paths, age thresholds and order match the Python.
 */
import { statSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { cleanupOldFiles, trimLogFile } from "../_shared/track-fs-cleanup";

const codexHome = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const cacheBase = join(codexHome, "fusengine");
const logsDir = join(cacheBase, "logs");

/** Remove the stale per-user changes-<USER>.json (>6h). */
function cleanupChangesFile(maxAgeSec: number): void {
  const user = process.env.USER ?? "unknown";
  const changesFile = join(cacheBase, `changes-${user}.json`);
  let m: number;
  try {
    if (!statSync(changesFile).isFile()) return;
    m = statSync(changesFile).mtimeMs / 1000;
  } catch { return; }
  if (Date.now() / 1000 - m > maxAgeSec) {
    try { unlinkSync(changesFile); } catch { /* ignore */ }
  }
}

cleanupOldFiles(join(cacheBase, "sessions"), "session-*.json", 86400);
cleanupChangesFile(21600);
trimLogFile(join(logsDir, "hooks.log"), 10485760, 5000);
cleanupOldFiles(join(logsDir, "00-apex"), "ref-cache-*.json", 86400);
process.exit(0);
