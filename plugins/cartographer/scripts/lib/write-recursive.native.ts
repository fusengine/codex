/**
 * write-recursive.native.ts — native TS port of _legacy_py/lib/write_recursive.py.
 * Writes one index.md per directory: subdirs become branches (link to nested
 * index.md), files become leaves (link to the REAL source file). Recurses.
 * Reuses describe + merge-index; inlined. Connectors/links match the Python.
 */
import { statSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { getFileDesc, countFiles } from "./describe.native";
import { mergeLines } from "./merge-index.native";

/** Return [dirs, files] under source, excluding hidden/private + excluded names. */
function listChildren(source: string, exclude: Set<string>): [string[], string[]] {
  let entries: string[];
  try { entries = readdirSync(source); } catch { return [[], []]; }
  const children = entries
    .filter((e) => !e.startsWith(".") && !e.startsWith("_") && !exclude.has(e))
    .sort()
    .map((e) => join(source, e));
  const dirs: string[] = [];
  const files: string[] = [];
  for (const c of children) {
    try {
      const st = statSync(c);
      if (st.isDirectory()) dirs.push(c);
      else if (st.isFile()) files.push(c);
    } catch { /* skip */ }
  }
  return [dirs, files];
}

/**
 * Write one index.md per directory, recursing into subdirs (mirrors write_tree).
 * @param source - Source directory to map.
 * @param output - Output directory for the index.md.
 * @param back - Optional back-link target.
 * @param exclude - Directory names to exclude.
 */
export function writeTree(source: string, output: string, back = "", exclude: Set<string> = new Set()): void {
  mkdirSync(output, { recursive: true });
  const [dirs, files] = listChildren(source, exclude);

  const lines = [`# ${basename(source)}\n`];
  if (back) lines.push(`> [← back](${back})\n`);

  const total = dirs.length + files.length;
  let idx = 0;
  for (const d of dirs) {
    idx++;
    const conn = idx === total ? "└──" : "├──";
    const count = countFiles(d, exclude);
    const hint = count ? ` — ${count} files` : "";
    lines.push(`${conn} [${basename(d)}/](./${basename(d)}/index.md)${hint}`);
    writeTree(d, join(output, basename(d)), "../index.md", exclude);
  }
  for (const f of files) {
    idx++;
    const conn = idx === total ? "└──" : "├──";
    const desc = getFileDesc(f);
    const suffix = desc ? ` — ${desc}` : "";
    lines.push(`${conn} [${basename(f)}](${f})${suffix}`);
  }

  const indexPath = join(output, "index.md");
  writeFileSync(indexPath, mergeLines(lines, indexPath).join("\n") + "\n", "utf-8");
}
