/**
 * track-cache-io.ts — atomic write + index load for the MCP cache pipeline.
 * Native TS port of _legacy_py/_shared/cache_io.py (atomic_write/load_index).
 * Bundle-safe (no import.meta.path).
 */
import {
  chmodSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Atomically write *data* to *path* with 0o600 permissions, creating parent
 * directories at 0o700. Writes to a temp file then renames so readers never
 * observe a partial write.
 *
 * @param path - Target file path.
 * @param data - UTF-8 string content.
 */
export function atomicWrite(path: string, data: string): void {
  const parent = dirname(path);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  const tmp = join(parent, `.cache_${randomBytes(8).toString("hex")}.tmp`);
  try {
    writeFileSync(tmp, data, { encoding: "utf-8", mode: 0o600 });
    chmodSync(tmp, 0o600);
    renameSync(tmp, path);
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* ignore */ }
    throw e;
  }
}

/**
 * Escape every non-ASCII char in a JSON string to a \uXXXX sequence, mirroring
 * Python json.dumps' default ensure_ascii=True so cached bodies are byte-equal.
 * Astral chars become surrogate pairs (which is exactly what Python emits too).
 *
 * @param json - A serialized JSON string.
 * @returns The same JSON with non-ASCII chars escaped.
 */
export function asciiEscape(json: string): string {
  let out = "";
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i);
    out += code > 0x7f ? `\\u${code.toString(16).padStart(4, "0")}` : json[i];
  }
  return out;
}

/**
 * Read a JSON list from *path*; return [] on missing or corrupt file.
 *
 * @param path - Index file path.
 * @returns Parsed array, or empty array.
 */
export function loadIndex(path: string): unknown[] {
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
