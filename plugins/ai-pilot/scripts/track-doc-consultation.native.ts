#!/usr/bin/env bun
// @hook-entry
/**
 * track-doc-consultation.native.ts — native TS port of
 * _legacy_py/track-doc-consultation.py.
 *
 * PostToolUse: record doc consultation (context7, exa, skill reads) into the
 * APEX 00-apex/<date>-state.json under a mkdir lock. Updates sources/source/
 * doc_sessions for the detected framework and the pending target framework,
 * migrating legacy `session` → `sessions[]`. State JSON (indent 2) + emitted
 * systemMessage match the Python.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { detectFramework, acquireStateLock, extractToolInfo } from "./lib/doc-track";

type Auth = { sources?: string[]; source?: string; doc_sessions?: string[]; sessions?: string[]; session?: string; doc_consulted?: string };
type State = { $schema?: string; target?: { framework?: string }; authorizations?: Record<string, Auth> };

/** Append `source:tool` to sources + doc_sessions for an auth entry. */
function updateDocSessions(fw: Auth, sid: string, source: string, tool: string): void {
  const entry = `${source}:${tool}`;
  const sources = fw.sources ?? [];
  if (!sources.includes(entry)) sources.push(entry);
  fw.sources = sources;
  fw.source = entry;
  const sessions = fw.doc_sessions ?? [];
  if (sid && !sessions.includes(sid)) sessions.push(sid);
  fw.doc_sessions = sessions;
}

/** Migrate legacy `session` to `sessions[]` with dedup of sid. */
function migrateSessions(entry: Auth, sid: string): void {
  const old = entry.session;
  delete entry.session;
  const sessions = entry.sessions ?? (old ? [old] : []);
  if (sid && !sessions.includes(sid)) sessions.push(sid);
  entry.sessions = sessions;
}

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const info = extractToolInfo(data);
if (!info) process.exit(0);
const [source, query, tool] = info;
const framework = detectFramework(query);

const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
const stateDir = join(codexHome, "fusengine", "logs", "00-apex");
mkdirSync(stateDir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const stateFile = join(stateDir, `${today}-state.json`);
const lockDir = join(stateDir, ".state.lock");
const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");

if (!(await acquireStateLock(lockDir))) process.exit(0);
try {
  const def: State = { $schema: "apex-state-v1", target: {}, authorizations: {} };
  let state: State = def;
  if (existsSync(stateFile)) {
    try { state = JSON.parse(readFileSync(stateFile, "utf8")) as State; } catch { state = def; }
  }
  const auth = (state.authorizations ??= {});
  const fwAuth = (auth[framework] ??= {});
  const sid = data.session_id ?? "";
  fwAuth.doc_consulted = ts;
  const targetFw = state.target?.framework ?? "";
  const tAuth = targetFw && targetFw !== framework ? (auth[targetFw] ??= {}) : null;
  if (tAuth) tAuth.doc_consulted = ts;
  updateDocSessions(fwAuth, sid, source, tool);
  if (tAuth) updateDocSessions(tAuth, sid, source, tool);
  for (const entry of tAuth ? [fwAuth, tAuth] : [fwAuth]) migrateSessions(entry, sid);
  writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
  console.log(JSON.stringify({
    systemMessage: `doc consulted: ${source}:${framework}`,
    hookSpecificOutput: { hookEventName: "PostToolUse" },
  }));
} finally {
  try { rmdirSync(lockDir); } catch { /* lock already gone */ }
}
process.exit(0);
