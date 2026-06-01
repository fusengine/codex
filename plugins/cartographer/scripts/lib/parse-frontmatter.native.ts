/**
 * parse-frontmatter.native.ts — native TS port of
 * _legacy_py/lib/parse_frontmatter.py. Extracts a YAML frontmatter field or the
 * first body line from a .md file. Dependency-free leaf lib; inlined into the
 * cartographer entry bundles. Regex + slicing match the Python byte-for-byte.
 */
import { statSync, readFileSync } from "node:fs";

/** Read a file as utf-8 (errors→replace like Python), or "" if not a file. */
function readText(filePath: string): string {
  try {
    if (!statSync(filePath).isFile()) return "";
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/** Escape a string for use as a literal in a RegExp (mirrors re.escape). */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract a single field value from YAML frontmatter (mirrors parse_field).
 * Skips block-scalar markers (|, >, …) exactly like the Python.
 * @param filePath - Markdown file path.
 * @param field - Frontmatter key to read.
 */
export function parseField(filePath: string, field: string): string {
  const text = readText(filePath);
  if (!text) return "";
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return "";
  for (const line of match[1]!.split("\n")) {
    const m = line.match(new RegExp(`^${escapeRe(field)}\\s*:\\s*(.+)$`));
    if (m) {
      const val = m[1]!.trim().replace(/^["']+|["']+$/g, "");
      if (["|", ">", "|+", "|-", ">+", ">-"].includes(val)) continue;
      return val;
    }
  }
  return "";
}

/**
 * Extract the first non-empty line after frontmatter (mirrors parse_body_desc).
 * @param filePath - Markdown file path.
 * @param maxLen - Max length of the returned description (default 60).
 */
export function parseBodyDesc(filePath: string, maxLen = 60): string {
  const text = readText(filePath);
  if (!text) return "";
  const match = text.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)/);
  if (!match) return "";
  for (const line of match[1]!.split("\n")) {
    const stripped = line.trim();
    if (stripped) return stripped.slice(0, maxLen);
  }
  return "";
}
