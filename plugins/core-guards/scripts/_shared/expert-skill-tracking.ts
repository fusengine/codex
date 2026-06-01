/**
 * expert-skill-tracking.ts — bundle-safe TS port of _shared/scripts/tracking.py.
 *
 * Writes skill-read / MCP-research evidence into the APEX 00-apex day state so
 * the check-*-skill gates can authorize the session. Mirrors the Python record
 * shape (doc_consulted, sources, doc_sessions+sessions, dual generic record)
 * byte-for-byte; JSON is indent=2 to match json.dump. Dependency-free.
 */
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";

const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");
const APEX_DIR = join(CODEX_HOME, "fusengine", "logs", "00-apex");

const MCP_FRAMEWORK_MAP: [string, string][] = [
  ["react", "react"], ["next", "nextjs"], ["tailwind", "tailwind"],
  ["swift", "swift"], ["swiftui", "swift"], ["ios", "swift"],
  ["design", "design"], ["shadcn", "design"], ["laravel", "laravel"], ["php", "laravel"],
];

/** Current UTC timestamp, %Y-%m-%dT%H:%M:%SZ (mirrors _utc_now). */
function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** Path to today's APEX day-state file. */
function stateFile(): string {
  const today = new Date().toISOString().slice(0, 10);
  return join(APEX_DIR, `${today}-state.json`);
}

/** Load the day state, defaulting to the v1 skeleton (mirrors _load_state). */
function loadState(path: string): Record<string, unknown> {
  const skeleton = { $schema: "apex-state-v1", target: {}, authorizations: {} };
  try {
    if (!statSync(path).isFile()) return skeleton;
    const s = JSON.parse(readFileSync(path, "utf-8"));
    return s && typeof s === "object" && !Array.isArray(s) ? s : {};
  } catch {
    return skeleton;
  }
}

/** Record one source under framework+session in the day state (mirrors _record_source). */
function recordSource(framework: string, sessionId: string, source: string): void {
  mkdirSync(APEX_DIR, { recursive: true });
  const path = stateFile();
  const state = loadState(path);
  const auth = (state.authorizations ??= {}) as Record<string, Record<string, unknown>>;
  const entry = (auth[framework] ??= {});
  entry.doc_consulted = utcNow();
  const sources = (entry.sources as string[]) ?? [];
  if (!sources.includes(source)) sources.push(source);
  entry.sources = sources;
  entry.source = source;
  for (const key of ["doc_sessions", "sessions"]) {
    const sessions = (entry[key] as string[]) ?? [];
    if (sessionId && !sessions.includes(sessionId)) sessions.push(sessionId);
    entry[key] = sessions;
  }
  writeFileSync(path, JSON.stringify(state, null, 2), "utf-8");
}

/**
 * Track a skill-read event (mirrors track_skill_read: dual generic record).
 * @param framework - Framework key (e.g. "tailwind", "swift").
 * @param skill - Skill label (e.g. "skill:Read").
 * @param topic - Read topic / file path.
 * @param sessionId - Session id (PID fallback when empty).
 */
export function trackSkillRead(framework: string, skill: string, topic: string, sessionId = ""): void {
  const sid = sessionId || String(process.pid);
  recordSource(framework, sid, `${skill}:${topic}`);
  if (framework !== "generic") recordSource("generic", sid, `${skill}:${topic}`);
}

/**
 * Track an MCP research call (mirrors track_mcp_research keyword routing).
 * @param source - Provider ("context7" | "exa" | "mcp").
 * @param tool - Tool name.
 * @param query - Query text (lower-cased for routing).
 * @param sessionId - Session id (PID fallback when empty).
 */
export function trackMcpResearch(source: string, tool: string, query: string, sessionId = ""): void {
  const sid = sessionId || String(process.pid);
  const q = query.toLowerCase();
  let framework = "generic";
  for (const [kw, fw] of MCP_FRAMEWORK_MAP) if (q.includes(kw)) framework = fw;
  recordSource(framework, sid, `${source}:${tool}`);
  if (framework !== "generic") recordSource("generic", sid, `${source}:${tool}`);
}
