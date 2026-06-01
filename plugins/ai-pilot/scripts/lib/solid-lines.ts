/**
 * solid-lines.ts — file-based code-line counter for ai-pilot SOLID post-hooks.
 *
 * Distinct from core-guards' content-based countCodeLines: this reads the file
 * from disk and skips `#` comments too (Python `_count_code_lines` in
 * check-solid-compliance.py / check-solid-from-transcript.py), so `.py` files
 * are counted faithfully. Returns 0 on read failure, like the Python.
 */
import { readFileSync } from "node:fs";

/**
 * Count non-empty, non-comment lines of a file (//, #, * prefixes skipped).
 * @param filePath - Path to read and count.
 * @returns Significant line count, or 0 if the file cannot be read.
 */
export function countFileCodeLines(filePath: string): number {
  let text: string;
  try {
    text = readFileSync(filePath, "utf8");
  } catch {
    return 0;
  }
  let count = 0;
  for (const line of text.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("//") || s.startsWith("#") || s.startsWith("*")) continue;
    count += 1;
  }
  return count;
}
