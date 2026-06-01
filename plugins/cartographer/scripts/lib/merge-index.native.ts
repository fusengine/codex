/**
 * merge-index.native.ts — native TS port of _legacy_py/lib/merge_index.py.
 * Merges new index.md lines with the existing file, preserving enriched
 * descriptions (sidecar .enriched.json > longer existing desc > new). Inlined
 * into the cartographer bundles. Entry regex (em-dash aware) matches the Python.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ENTRY_RE = /^(.*?)\[([^\]]+)\]\(([^)]+)\)\s*(?:—|-{1,2})\s*(.*)$/;

/** Parse (prefix, name, path, desc) from a tree line, or null. */
function parseEntry(line: string): [string, string, string, string] | null {
  const m = line.match(ENTRY_RE);
  return m ? [m[1]!, m[2]!, m[3]!, m[4]!] : null;
}

/** Load enriched descriptions map from sidecar .enriched.json. */
function loadEnriched(outputPath: string): Record<string, string> {
  const sidecar = join(dirname(outputPath), ".enriched.json");
  if (!existsSync(sidecar)) return {};
  try {
    const data = JSON.parse(readFileSync(sidecar, "utf-8"));
    return data.entries ?? {};
  } catch {
    return {};
  }
}

/**
 * Save an enriched description to the sidecar (mirrors save_enriched).
 * @param outputPath - The index.md path whose sibling sidecar is updated.
 * @param path - Entry link target.
 * @param desc - Enriched description.
 */
export function saveEnriched(outputPath: string, path: string, desc: string): void {
  const sidecar = join(dirname(outputPath), ".enriched.json");
  let data: { version: number; entries: Record<string, string> } = { version: 1, entries: {} };
  if (existsSync(sidecar)) {
    try { data = JSON.parse(readFileSync(sidecar, "utf-8")); } catch { /* keep default */ }
  }
  (data.entries ??= {})[path] = desc;
  writeFileSync(sidecar, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Merge new lines with the existing index, preserving enriched descriptions
 * (mirrors merge_lines). Priority: sidecar > longer existing desc > new.
 * @param newLines - Freshly generated lines.
 * @param outputPath - Target index.md path (read for existing descs).
 */
export function mergeLines(newLines: string[], outputPath: string): string[] {
  const enriched = loadEnriched(outputPath);
  const existingDescs: Record<string, string> = {};
  if (existsSync(outputPath)) {
    for (const line of readFileSync(outputPath, "utf-8").split("\n")) {
      const parsed = parseEntry(line);
      if (parsed) existingDescs[parsed[2]] = parsed[3];
    }
  }
  const merged: string[] = [];
  for (let line of newLines) {
    const parsed = parseEntry(line);
    if (parsed) {
      const [prefix, name, path, newDesc] = parsed;
      if (path in enriched) {
        line = `${prefix}[${name}](${path}) — ${enriched[path]}`;
      } else {
        const old = existingDescs[path] ?? "";
        if (old.length > newDesc.length) line = `${prefix}[${name}](${path}) — ${old}`;
      }
    }
    merged.push(line);
  }
  return merged;
}
