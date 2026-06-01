/**
 * track-cache-compactor.ts — compaction helpers for the MCP cache pipeline.
 * Native TS port of _legacy_py/_shared/cache_compactor.py (compact_markdown /
 * query_hash / jaccard_similar). Behaviour (entity decode, boilerplate strip,
 * whitespace normalize, 5KB UTF-8 truncate, 8-char md5, Jaccard) is faithful.
 */
import { createHash } from "node:crypto";

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#x27;": "'", "&#39;": "'", "&nbsp;": " ", "&apos;": "'",
};
const BOILERPLATE: RegExp[] = [
  /^.*cookie.*(accept|consent|banner).*$/gim,
  /^.*was this (helpful|page helpful|article helpful).*$/gim,
  /^.*©\s*\d{4}.*all rights reserved.*$/gim,
  /^\s*(home|about|contact|privacy|terms)\s*\|\s*.*$/gim,
  /^.*subscribe to (our )?newsletter.*$/gim,
  /^.*follow us on (twitter|facebook|linkedin).*$/gim,
];
const MAX_BYTES = 5 * 1024;

/** Decode named + numeric (hex/dec) HTML entities to their unicode chars. */
function decodeEntities(text: string): string {
  let out = text;
  for (const [ent, ch] of Object.entries(HTML_ENTITIES)) out = out.split(ent).join(ch);
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)));
  out = out.replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)));
  return out;
}

/**
 * Compact markdown: strip entities/boilerplate, normalize whitespace, truncate
 * to ~5KB (UTF-8) with a "[... truncated, N lines]" marker when oversized.
 *
 * @param content - Raw markdown/text content.
 * @returns Compacted string.
 */
export function compactMarkdown(content: string): string {
  let text = decodeEntities(content);
  for (const pat of BOILERPLATE) text = text.replace(pat, "");
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  const encoded = Buffer.from(text, "utf-8");
  if (encoded.length > MAX_BYTES) {
    const truncated = encoded.subarray(0, MAX_BYTES).toString("utf-8");
    const remaining = (text.slice(truncated.length).match(/\n/g) ?? []).length;
    text = `${truncated}\n\n[... truncated, ${remaining} lines]`;
  }
  return text;
}

/**
 * Compute the 8-char MD5 hash of "tool_name::query".
 *
 * @param toolName - MCP tool identifier.
 * @param query - Query payload string.
 * @returns First 8 hex chars of the MD5 digest.
 */
export function queryHash(toolName: string, query: string): string {
  return createHash("md5").update(`${toolName}::${query}`, "utf-8").digest("hex").slice(0, 8);
}

/**
 * Bag-of-words Jaccard similarity check between two queries.
 *
 * @param queryA - First query string.
 * @param queryB - Second query string.
 * @param threshold - Minimum Jaccard score to consider similar.
 * @returns True if intersection/union > threshold.
 */
export function jaccardSimilar(queryA: string, queryB: string, threshold = 0.8): boolean {
  const a = new Set(queryA.toLowerCase().split(/\s+/).filter(Boolean));
  const b = new Set(queryB.toLowerCase().split(/\s+/).filter(Boolean));
  if (a.size === 0 || b.size === 0) return false;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return inter / union > threshold;
}
