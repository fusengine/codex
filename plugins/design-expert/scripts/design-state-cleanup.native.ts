#!/usr/bin/env bun
// @hook-entry
/**
 * design-state-cleanup.native.ts — native TS port of
 * _legacy_py/design-state-cleanup.py.
 *
 * SubagentStop(design): archive the current state file with a timestamp suffix,
 * then remove archived .design-state-* files older than 7 days. Paths + naming
 * match the Python.
 */
import { existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR } from "./lib/design-state";

const MAX_AGE_DAYS = 7;

/** Rename the current state file with a UTC timestamp suffix. */
function archiveState(agentId: string): void {
  const src = join(CACHE_DIR, `.design-state-${agentId}.json`);
  if (!existsSync(src)) return;
  const ts = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "");
  const stamp = `${ts.slice(0, 8)}-${ts.slice(9, 15)}`;
  renameSync(src, join(CACHE_DIR, `.design-state-${agentId}-${stamp}.json`));
}

/** Remove archived state files older than MAX_AGE_DAYS. */
function cleanupOldStates(): void {
  if (!existsSync(CACHE_DIR)) return;
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400 * 1000;
  for (const fname of readdirSync(CACHE_DIR)) {
    if (!fname.startsWith(".design-state-")) continue;
    const path = join(CACHE_DIR, fname);
    try {
      if (statSync(path).mtimeMs < cutoff) rmSync(path);
    } catch { /* skip */ }
  }
}

let data: { hook_event_name?: string; agent_type?: string; agent_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (data.hook_event_name !== "SubagentStop") process.exit(0);
if (!(data.agent_type ?? "").includes("design")) process.exit(0);

const agentId = data.agent_id ?? "";
if (agentId) archiveState(agentId);
cleanupOldStates();
process.exit(0);
