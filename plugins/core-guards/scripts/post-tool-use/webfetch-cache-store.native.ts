#!/usr/bin/env bun
// @hook-entry
/**
 * webfetch-cache-store.native.ts — native TS port of
 * _legacy_py/post-tool-use/webfetch-cache-store.py.
 *
 * PostToolUse(WebFetch): persist the compacted response to the global webfetch
 * cache at ~/.claude/fusengine-cache/webfetch/<hash>.md. Hash, layout, front
 * matter (ensure_ascii via asciiEscape) and the always-overwrite (mtime
 * refresh) behaviour are faithful to the Python.
 */
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { compactMarkdown } from "../_shared/track-cache-compactor";
import { asciiEscape, atomicWrite } from "../_shared/track-cache-io";
import { extractText } from "../_shared/track-mcp-response";
import { utcStamp } from "../_shared/track-time";

const TOOL_NAME = "WebFetch";
const PROMPT_TRUNC = 500;
const CACHE_DIR = join(homedir(), ".claude", "fusengine-cache", "webfetch");

/** 16-char sha256 of "url\nprompt[:500]" (aligned with the lookup hook). */
function cacheKey(url: string, prompt: string): string {
  const payload = `${url}\n${prompt.slice(0, PROMPT_TRUNC)}`;
  return createHash("sha256").update(payload, "utf-8").digest("hex").slice(0, 16);
}

/** Extract markdown from a WebFetch tool_response (str | dict{text} | list). */
function normalizeResponse(toolResponse: unknown): string {
  if (toolResponse && typeof toolResponse === "object" && !Array.isArray(toolResponse)) {
    const text = (toolResponse as Record<string, unknown>).text;
    if (typeof text === "string") return text;
  }
  if (typeof toolResponse === "string" || Array.isArray(toolResponse)) {
    return extractText(toolResponse);
  }
  if (!toolResponse) return "";
  return String(toolResponse);
}

let data: { tool_name?: string; tool_input?: { url?: unknown; prompt?: unknown }; tool_response?: unknown };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (data.tool_name !== TOOL_NAME) process.exit(0);
const ti = data.tool_input ?? {};
const url = ti.url;
let prompt = ti.prompt;
if (typeof url !== "string" || !url.trim()) process.exit(0);
if (typeof prompt !== "string") prompt = "";
const urlClean = url.trim();

const body = compactMarkdown(normalizeResponse(data.tool_response));
if (!body) process.exit(0);

const promptStr = prompt as string;
const qhash = cacheKey(urlClean, promptStr);
const path = join(CACHE_DIR, `${qhash}.md`);
const ts = utcStamp();
const front = `---\ntool: ${TOOL_NAME}\nurl: ${asciiEscape(JSON.stringify(urlClean))}\n` +
  `prompt: ${asciiEscape(JSON.stringify(promptStr.slice(0, PROMPT_TRUNC)))}\nts: ${ts}\nhash: ${qhash}\n---\n\n`;
atomicWrite(path, front + body);
process.exit(0);
