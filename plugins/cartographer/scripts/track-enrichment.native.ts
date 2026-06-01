#!/usr/bin/env bun
// @hook-entry
/**
 * track-enrichment.native.ts — native TS port of _legacy_py/track-enrichment.py.
 * PostToolUse: when an Edit/Write targets a .cartographer/**\/index.md, extract
 * each entry's description into a sibling .enriched.json so enriched text
 * survives regeneration. Entry regex requires a non-empty desc (mirrors Python).
 */
import { statSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ENTRY_RE = /^(?:.*?)\[([^\]]+)\]\(([^)]+)\)\s*(?:—|-{1,2})\s*(.+)$/;

let data: { tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const fp = data.tool_input?.file_path ?? "";
if (!fp || !fp.includes(".cartographer") || !fp.endsWith("index.md")) process.exit(0);
try { if (!statSync(fp).isFile()) process.exit(0); } catch { process.exit(0); }

const sidecar = join(dirname(fp), ".enriched.json");
let existing: { version: number; entries: Record<string, string> } = { version: 1, entries: {} };
try { existing = JSON.parse(readFileSync(sidecar, "utf-8")); } catch { /* keep default */ }

const entries = (existing.entries ??= {});
for (const line of readFileSync(fp, "utf-8").split("\n")) {
  const m = line.match(ENTRY_RE);
  if (m) {
    const [, , path, rawDesc] = m;
    const desc = rawDesc!.trim();
    if (desc) entries[path!] = desc;
  }
}

writeFileSync(sidecar, JSON.stringify(existing, null, 2) + "\n", "utf-8");
