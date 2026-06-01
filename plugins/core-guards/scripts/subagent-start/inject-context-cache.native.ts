#!/usr/bin/env bun
// @hook-entry
/**
 * inject-context-cache.native.ts — native TS port of
 * _legacy_py/subagent-start/inject-context-cache.py.
 *
 * SubagentStart: emit the fresh MCP-cache index for the session as a markdown
 * table in additionalContext. TTL, freshness window, truncation and the
 * (intentionally unaccented) French header text are faithful to the Python.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { loadIndex } from "../_shared/track-cache-io";
import { sanitizeSessionId } from "../_shared/state-manager";

const BASE_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "sessions");
const DEFAULT_TTL_MIN = 30;
const TS_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;

interface Entry { tool?: string; query?: string; file?: string; ts?: string }

/** Cache TTL minutes from FUSENGINE_CACHE_TTL_MIN, else the default. */
function ttlMinutes(): number {
  const raw = (process.env.FUSENGINE_CACHE_TTL_MIN ?? "").trim();
  if (!/^[+-]?\d+$/.test(raw)) return DEFAULT_TTL_MIN;
  const val = parseInt(raw, 10);
  return val > 0 ? val : DEFAULT_TTL_MIN;
}

/** True if an ISO "YYYY-MM-DDTHH:MM:SSZ" ts is within ttlMin minutes of now. */
function isFresh(tsStr: string, ttlMin: number): boolean {
  const m = TS_RE.exec(tsStr ?? "");
  if (!m) return false;
  const ts = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  const ageSec = (Date.now() - ts) / 1000;
  return ageSec >= 0 && ageSec <= ttlMin * 60;
}

/** Sanitize + truncate a cell value (mirrors _truncate). */
function truncate(text: string, limit = 60): string {
  const t = (text || "").replaceAll("|", "/").replaceAll("\n", " ");
  return t.length <= limit ? t : `${t.slice(0, limit - 3)}...`;
}

/** Render fresh entries as the markdown injection block. */
function render(entries: Entry[]): string {
  const lines = [
    "# MCP Cache disponible cette session",
    "Avant de lancer mcp__context7/exa, verifie si deja cached.",
    "Lis le fichier .md via Read pour recuperer le resultat.",
    "APEX: Read sur cache MCP compte comme research-expert satisfait.",
    "",
    "| Tool | Query | File |",
    "| --- | --- | --- |",
  ];
  for (const e of entries) {
    lines.push(`| ${truncate(e.tool ?? "", 40)} | ${truncate(e.query ?? "", 60)} | ${truncate(e.file ?? "", 50)} |`);
  }
  return lines.join("\n");
}

let data: { session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

let sid: string;
try {
  sid = sanitizeSessionId(data.session_id || "unknown");
} catch {
  process.exit(0);
}

const entries = loadIndex(join(BASE_DIR, sid, "context", "index.json")) as Entry[];
if (!entries.length) process.exit(0);
const ttl = ttlMinutes();
const fresh = entries.filter((e) => isFresh(e.ts ?? "", ttl));
if (!fresh.length) process.exit(0);

process.stdout.write(JSON.stringify({ hookSpecificOutput: {
  hookEventName: "SubagentStart",
  additionalContext: render(fresh),
} }) + "\n");
process.exit(0);
