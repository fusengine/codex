/**
 * apex-state-read.ts — bundle-safe TS port of the APEX day-state readers in
 * _shared/scripts/check_skill_common.py + mcp_research.py. Reads the
 * 00-apex/<day>-state.json authorizations written by expert-skill-tracking and
 * answers "was this framework/skill consulted in this session within TTL?".
 * Dependency-free for inlining.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

type Entry = Record<string, unknown>;

/** Path to today's APEX day-state file (mirrors _apex_state_file). */
function apexStateFile(): string {
  const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  const today = new Date().toISOString().slice(0, 10);
  return join(codexHome, "fusengine", "logs", "00-apex", `${today}-state.json`);
}

/** Parse the day state's authorizations map (best-effort). */
function loadAuthorizations(): Record<string, Entry> {
  const path = apexStateFile();
  if (!existsSync(path)) return {};
  try {
    const state = JSON.parse(readFileSync(path, "utf-8"));
    const auth = state?.authorizations;
    return auth && typeof auth === "object" ? auth : {};
  } catch {
    return {};
  }
}

/** A framework's authorization entry, or {} (mirrors _load_apex_authorization). */
export function frameworkAuthorization(framework: string): Entry {
  const entry = loadAuthorizations()[framework];
  return entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {};
}

/** Parse %Y-%m-%dT%H:%M:%SZ to epoch seconds; NaN on failure. */
function parseStampSec(stamp: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(stamp)) return NaN;
  return Date.parse(stamp) / 1000;
}

/** True if session is authorized for this entry within ttl (mirrors _session_authorized). */
export function sessionAuthorized(entry: Entry, sessionId: string, ttl = 180): boolean {
  const sessions = (entry.doc_sessions as string[]) ?? (entry.sessions as string[]) ?? [];
  if (!sessions.includes(sessionId)) return false;
  const ts = parseStampSec(String(entry.doc_consulted ?? ""));
  if (Number.isNaN(ts)) return false;
  return ttl >= Date.now() / 1000 - ts;
}

/**
 * True if Context7+Exa research is recorded for this session within ttl across
 * any framework entry (mirrors _apex_mcp_research_done).
 * @param sessionId - Session id.
 * @param ttl - Freshness window in seconds.
 */
export function apexMcpResearchDone(sessionId: string, ttl = 180): boolean {
  for (const entry of Object.values(loadAuthorizations())) {
    if (!sessionAuthorized(entry, sessionId, ttl)) continue;
    const found = new Set(
      ((entry.sources as string[]) ?? []).map((s) => String(s).split(":", 1)[0]),
    );
    if (found.has("context7") && found.has("exa")) return true;
  }
  return false;
}
