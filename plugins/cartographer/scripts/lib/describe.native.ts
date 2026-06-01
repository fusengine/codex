/**
 * describe.native.ts — native TS port of _legacy_py/lib/describe.py. Extracts a
 * description for a file (frontmatter / heading / first comment) and counts
 * non-hidden files recursively. Reuses parse-frontmatter; inlined into the
 * cartographer bundles. Suffix list + slicing match the Python.
 */
import { statSync, readFileSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { parseField } from "./parse-frontmatter.native";

const SOURCE_SUFFIXES = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".swift"]);

/** Read a file's lines (errors→replace), or [] on failure. */
function readLines(filePath: string): string[] {
  try {
    return readFileSync(filePath, "utf-8").split("\n");
  } catch {
    return [];
  }
}

/** First "# heading" text from a markdown file (mirrors _first_heading). */
function firstHeading(filePath: string): string {
  for (const line of readLines(filePath)) {
    if (line.startsWith("# ")) return line.replace(/^[# ]+/, "").trim().slice(0, 60);
  }
  return "";
}

/** First comment/docstring from a source file (mirrors _first_comment). */
function firstComment(filePath: string): string {
  const lines = readLines(filePath);
  for (const line of lines.slice(0, 10)) {
    const s = line.trim();
    if ((s.startsWith("//") || s.startsWith("#")) && !s.startsWith("#!")) {
      return s.replace(/^[/#! ]+/, "").trim().slice(0, 60);
    }
    if (s.startsWith('"""') || s.startsWith("'''")) {
      return s.replace(/^["' ]+|["' ]+$/g, "").slice(0, 60);
    }
  }
  return "";
}

/**
 * Extract a file's description: frontmatter desc / heading (md) or first comment
 * (source) (mirrors get_file_desc).
 * @param filePath - File to describe.
 */
export function getFileDesc(filePath: string): string {
  const ext = extname(filePath);
  if (ext === ".md") {
    return parseField(filePath, "description").slice(0, 60) || firstHeading(filePath);
  }
  if (SOURCE_SUFFIXES.has(ext)) return firstComment(filePath);
  return "";
}

/**
 * Count files recursively (mirrors count_files / rglob + part filter: traverse
 * every dir — pathlib rglob descends hidden dirs too — and count files whose
 * relative path has no part starting with "." or "_" nor in the exclude set).
 * @param directory - Directory to walk.
 * @param exclude - Names to skip.
 */
export function countFiles(directory: string, exclude: Set<string> = new Set()): number {
  let count = 0;
  const walk = (dir: string): void => {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const e of entries) {
      const full = join(dir, e);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        const parts = relative(directory, full).split("/");
        if (!parts.some((p) => p.startsWith(".") || p.startsWith("_") || exclude.has(p))) count++;
      }
    }
  };
  walk(directory);
  return count;
}
