#!/usr/bin/env bun
/**
 * validate-seo.ts — PostToolUse hook (@hook-entry)
 * Validates meta + schema + OG on edited HTML-like files.
 * Opt-in via `.fuse-seo` marker at project root.
 * Reads PostToolUse JSON payload from stdin; exits 0 (allow), 2 (block with stderr).
 */
import * as cheerio from "cheerio";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { asRecord } from "../../core-guards/scripts/_shared/as-record";
import { emitPostTool } from "../../core-guards/scripts/_shared/hook-output-post";

/** Locate `.fuse-seo` marker by walking up from a starting directory. */
function findMarker(start: string): string | null {
  let dir = resolve(start);
  while (dir !== "/") {
    if (existsSync(`${dir}/.fuse-seo`)) return dir;
    dir = dirname(dir);
  }
  return null;
}

/** Check meta/OG/schema completeness on HTML-like content. Returns missing items. */
function validate(html: string): string[] {
  const $ = cheerio.load(html);
  const missing: string[] = [];
  if (!$("title").text().trim()) missing.push("<title>");
  if (!$("meta[name='description']").attr("content")) missing.push("<meta name='description'>");
  if (!$("meta[property='og:title']").attr("content")) missing.push("og:title");
  if (!$("meta[property='og:description']").attr("content")) missing.push("og:description");
  if (!$("meta[property='og:image']").attr("content")) missing.push("og:image");
  if (!$("link[rel='canonical']").attr("href")) missing.push("canonical");
  if ($("script[type='application/ld+json']").length === 0) missing.push("JSON-LD schema");
  return missing;
}

async function main(): Promise<void> {
  const raw = await Bun.stdin.text();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { process.exit(0); }
  const payload = asRecord(parsed);
  if (!payload) process.exit(0);
  const toolInput = asRecord(payload.tool_input);
  const path = typeof toolInput?.file_path === "string" ? toolInput.file_path : undefined;
  if (!path) process.exit(0);
  if (!/\.(html|astro|tsx|vue|blade\.php)$/.test(path)) process.exit(0);
  const cwd = typeof payload.cwd === "string" ? payload.cwd : dirname(path);
  if (!findMarker(cwd)) process.exit(0);

  try {
    const content = await Bun.file(path).text();
    const missing = validate(content);
    if (missing.length > 0) {
      emitPostTool(
        `fuse-seo: missing SEO elements in ${path}:\n  - ${missing.join("\n  - ")}`,
        "validate-seo",
      );
    }
  } catch {
    process.exit(0);
  }
}

await main();
