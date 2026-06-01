#!/usr/bin/env bun
// @hook-entry
/**
 * cache-mcp-result.native.ts — native TS port of
 * _legacy_py/post-tool-use/cache-mcp-result.py.
 *
 * PostToolUse: cache MCP search results into the per-session context store,
 * deduping by exact hash and Jaccard similarity. File paths, front-matter,
 * index entries and skip conditions are faithful to the Python.
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { sanitizeSessionId } from "../_shared/state-manager";
import { compactMarkdown, jaccardSimilar, queryHash } from "../_shared/track-cache-compactor";
import { asciiEscape, atomicWrite, loadIndex } from "../_shared/track-cache-io";
import { extractText } from "../_shared/track-mcp-response";
import { utcStamp } from "../_shared/track-time";

const BASE_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "sessions");

/** Map an MCP tool id to its query fields, or null when uncacheable. */
function queryKeys(tool: string): string[] | null {
  if (tool.includes("get_code_context_exa")) return ["query", "libraryName"];
  if (tool.includes("web_search_exa")) return ["query"];
  if (tool.includes("context7") && tool.includes("query")) return ["query", "topic", "libraryName"];
  return null;
}

/** Short slug for an MCP tool id (mcp__a__b -> a-b). */
function shortName(tool: string): string {
  return tool.replace(/mcp__/g, "").replace(/__/g, "-");
}

/** First non-empty string field from tool_input among *keys*. */
function extractQuery(ti: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = ti[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

interface IndexEntry { tool?: string; query?: string }

let data: { tool_name?: string; session_id?: string; tool_input?: Record<string, unknown>; tool_response?: unknown };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "";
const keys = queryKeys(tool);
if (keys === null) process.exit(0);
const query = extractQuery(data.tool_input ?? {}, keys);
if (!query) process.exit(0);

let sid: string;
try {
  sid = sanitizeSessionId(data.session_id || "unknown");
} catch {
  process.exit(0);
}

const qhash = queryHash(tool, query);
const ctxRoot = join(BASE_DIR, sid, "context");
const filePath = join(ctxRoot, "mcp", `${shortName(tool)}-${qhash}.md`);
const indexPath = join(ctxRoot, "index.json");

if (existsSync(filePath)) process.exit(0);
const index = loadIndex(indexPath) as IndexEntry[];
const dup = index.some((e) => e.tool === tool && jaccardSimilar(e.query ?? "", query));
if (dup) process.exit(0);

const body = compactMarkdown(extractText(data.tool_response));
const ts = utcStamp();
const front = `---\ntool: ${tool}\nquery: ${asciiEscape(JSON.stringify(query))}\nts: ${ts}\nhash: ${qhash}\n---\n\n`;
atomicWrite(filePath, front + body);
index.push({ tool, query, hash: qhash, ts, file: basename(filePath) } as IndexEntry);
atomicWrite(indexPath, asciiEscape(JSON.stringify(index, null, 2)));
process.exit(0);
