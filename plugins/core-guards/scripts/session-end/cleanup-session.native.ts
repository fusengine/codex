#!/usr/bin/env bun
// @hook-entry
/**
 * cleanup-session.native.ts — native TS port of
 * _legacy_py/session-end/cleanup-session.py.
 *
 * SessionEnd: remove stale temp files — ~/.codex/fusengine/session-tmp/*.tmp
 * (>1h, homedir-based) and $CODEX_HOME/fusengine/claude_solid_reads_* /
 * claude_session_changes_* (>2h). Paths and thresholds match the Python.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { cleanupOldFiles } from "../_shared/track-fs-cleanup";

// session-tmp is homedir-based in the Python (os.path.expanduser('~')), NOT CODEX_HOME.
const trackingDir = join(homedir(), ".codex", "fusengine", "session-tmp");
cleanupOldFiles(trackingDir, "*.tmp", 3600);

const cacheBase = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine");
cleanupOldFiles(cacheBase, "claude_solid_reads_*", 7200);
cleanupOldFiles(cacheBase, "claude_session_changes_*", 7200);

process.exit(0);
