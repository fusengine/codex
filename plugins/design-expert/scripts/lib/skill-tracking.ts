/**
 * skill-tracking.ts — design-expert skill-tracking dir helpers.
 *
 * Ports the TRACKING_DIR scans used by check-inspiration-read.py
 * (_tracking_has), require-scroll-before-screenshot.py
 * (_scroll_done_since_last_nav) and track-mcp-research.py (per-agent log append).
 * TRACKING_DIR layout matches the Python.
 */
import { appendFileSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR } from "./design-state";

export const TRACKING_DIR = join(CACHE_DIR, "skill-tracking");

function isFile(p: string): boolean { try { return statSync(p).isFile(); } catch { return false; } }
function isDir(p: string): boolean { try { return statSync(p).isDirectory(); } catch { return false; } }

/** True if any session tracking file contains `keyword` (mirrors _tracking_has). */
export function trackingHas(sessionId: string, keyword: string): boolean {
  if (!isDir(TRACKING_DIR)) return false;
  for (const fname of readdirSync(TRACKING_DIR)) {
    if (!fname.includes(sessionId)) continue;
    try {
      if (readFileSync(join(TRACKING_DIR, fname), "utf8").includes(keyword)) return true;
    } catch { /* skip */ }
  }
  return false;
}

/** True if a browser_evaluate/run_code happened after the last browser_navigate. */
export function scrollDoneSinceLastNav(agentId: string): boolean {
  const agentFile = join(TRACKING_DIR, `agent-${agentId}`);
  if (!isFile(agentFile)) return false;
  let lines: string[];
  try { lines = readFileSync(agentFile, "utf8").split("\n"); } catch { return false; }
  let lastNav = -1;
  lines.forEach((line, i) => { if (line.includes("browser_navigate")) lastNav = i; });
  if (lastNav === -1) return false;
  return lines.slice(lastNav + 1).some((l) => l.includes("browser_evaluate") || l.includes("browser_run_code"));
}

/** Append a per-agent research line (mirrors track-mcp-research per-agent log). */
export function appendAgentTrack(agentId: string, line: string): void {
  mkdirSync(TRACKING_DIR, { recursive: true });
  appendFileSync(join(TRACKING_DIR, `agent-${agentId}`), `${line}\n`, "utf8");
}
