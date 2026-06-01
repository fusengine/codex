#!/usr/bin/env bun
// @hook-entry
/**
 * webfetch-cache-lookup.native.ts — native TS port of
 * _legacy_py/pre-tool-use/webfetch-cache-lookup.py.
 *
 * PreToolUse(WebFetch): deny with the cached body when a fresh cache entry
 * (~/.claude/fusengine-cache/webfetch/<sha256_16>.md, key = url + "\n" +
 * prompt[:500], 24h TTL) exists. Hash, paths, TTL and reason string are
 * verbatim from the Python for strict parity.
 */
import { createHash } from "node:crypto";
import { existsSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_DIR = join(homedir(), ".claude", "fusengine-cache", "webfetch");
const TTL_SECONDS = 24 * 3600;
const MAX_BODY = 8 * 1024;
const PROMPT_TRUNC = 500;

/** 16-char sha256 hex of `url + "\n" + prompt[:500]` (mirrors _cache_key). */
function cacheKey(url: string, prompt: string): string {
  const payload = `${url}\n${prompt.slice(0, PROMPT_TRUNC)}`;
  return createHash("sha256").update(payload, "utf-8").digest("hex").slice(0, 16);
}

/** Read up to MAX_BODY bytes from path; "" on failure (mirrors _read_body). */
function readBody(path: string): string {
  try {
    const fd = openSync(path, "r");
    try {
      const buf = Buffer.alloc(MAX_BODY);
      const n = readSync(fd, buf, 0, MAX_BODY, 0);
      return buf.subarray(0, n).toString("utf-8");
    } finally {
      closeSync(fd);
    }
  } catch {
    return "";
  }
}

/** Emit PreToolUse deny JSON and exit 0. */
function deny(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  }));
  process.exit(0);
}

let data: { tool_name?: string; tool_input?: { url?: unknown; prompt?: unknown } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}
if (data.tool_name !== "WebFetch") process.exit(0);
const ti = data.tool_input ?? {};
const url = ti.url;
let prompt = ti.prompt;
if (typeof url !== "string" || !url.trim()) process.exit(0);
if (typeof prompt !== "string") prompt = "";
const path = join(CACHE_DIR, `${cacheKey(url.trim(), prompt as string)}.md`);
if (!existsSync(path) || !statSync(path).isFile()) process.exit(0);
let age: number;
try {
  age = Date.now() / 1000 - statSync(path).mtimeMs / 1000;
} catch {
  process.exit(0);
}
if (age >= TTL_SECONDS) process.exit(0);
const body = readBody(path);
if (!body) process.exit(0);
deny(
  `CACHE HIT WebFetch (~${Math.floor(body.length / 1024) + 1}KB economise, `
  + `cached il y a ${Math.floor(age / 3600)}h):\n\n${body}\n\n`
  + "Pour forcer un nouveau fetch, modifie l'URL ou la query.",
);
