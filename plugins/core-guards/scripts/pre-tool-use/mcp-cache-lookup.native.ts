#!/usr/bin/env bun
// @hook-entry
/**
 * mcp-cache-lookup.native.ts — native TS port of
 * _legacy_py/pre-tool-use/mcp-cache-lookup.py.
 *
 * PreToolUse: short-circuit exa/context7 MCP calls when a fresh cached answer
 * exists under <CODEX_HOME>/fusengine/sessions/<sid>/context/mcp. Query-key
 * mapping, rg lookup, TTL and reason string are verbatim for strict parity.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { sanitizeSessionId } from "../_shared/state-manager";

const CODEX_HOME = process.env.CODEX_HOME ?? join(homedir(), ".codex");
const BASE_DIR = join(CODEX_HOME, "fusengine", "sessions");
const MAX_BODY = 8 * 1024;
const RG_TIMEOUT = 2000;
const TTL_SECONDS = 48 * 3600;

/** Map an MCP tool id to its query fields by substring (mirrors _query_keys). */
function queryKeys(toolName: string): string[] | null {
  if (toolName.includes("get_code_context_exa")) return ["query", "libraryName"];
  if (toolName.includes("web_search_exa")) return ["query"];
  if (toolName.includes("context7") && toolName.includes("query")) return ["query", "topic", "libraryName"];
  return null;
}

/** First non-empty trimmed string value among keys (mirrors _extract_query). */
function extractQuery(ti: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = ti[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

/** rg -l -i -F --max-count=1 of the first 80 chars; "" on miss (mirrors _rg_find). */
function rgFind(query: string, cacheDir: string): string {
  const needle = query.replace(/[\n\r]/g, " ").slice(0, 80);
  const r = spawnSync("rg", ["-l", "-i", "-F", "--max-count=1", needle, cacheDir],
    { timeout: RG_TIMEOUT, encoding: "utf-8" });
  if (r.error || (r.status ?? 1) !== 0 || !r.stdout) return "";
  return r.stdout.split(/\r?\n/)[0]!.trim();
}

/** Read up to MAX_BODY bytes; "" on failure (mirrors _read_body). */
function readBody(path: string): string {
  try {
    const fd = openSync(path, "r");
    try {
      const buf = Buffer.alloc(MAX_BODY);
      const n = readSync(fd, buf, 0, MAX_BODY, 0);
      return buf.subarray(0, n).toString("utf-8");
    } finally { closeSync(fd); }
  } catch { return ""; }
}

let data: { tool_name?: string; session_id?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
const keys = queryKeys(data.tool_name ?? "");
if (keys === null) process.exit(0);
const query = extractQuery(data.tool_input ?? {}, keys);
let sid: string;
try {
  sid = sanitizeSessionId(data.session_id || "unknown");
} catch {
  process.exit(0);
}
const cacheDir = join(BASE_DIR, sid, "context", "mcp");
if (!query || !existsSync(cacheDir) || !statSync(cacheDir).isDirectory()) process.exit(0);
const match = rgFind(query, cacheDir);
if (!match) process.exit(0);
let age: number;
try {
  age = Date.now() / 1000 - statSync(match).mtimeMs / 1000;
} catch {
  process.exit(0);
}
if (age >= TTL_SECONDS) process.exit(0);
const body = readBody(match);
if (body) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `CACHE HIT (~${Math.floor(body.length / 1024) + 1}KB saved, cached ${Math.floor(age / 3600)}h ago): ${body}`,
    },
  }));
  process.exit(0);
}
process.exit(0);
