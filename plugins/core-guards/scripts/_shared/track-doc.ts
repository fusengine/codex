/**
 * track-doc.ts — project-root + framework detection helpers for
 * auto-document-reads.native.ts. Ported from
 * _legacy_py/post-tool-use/auto-document-reads.py (find_project_root /
 * detect_framework). Kept local + bundle-safe (no import.meta.path); the
 * ai-pilot helpers of similar name use a different signature and import.meta,
 * so they cannot be reused across the plugin isolation boundary.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Walk up from *directory* to the first project root marker.
 *
 * @param directory - Starting directory.
 * @returns Project root path, or "" when none is found.
 */
export function resolveProjectRoot(directory: string): string {
  let d = directory;
  while (d !== "/") {
    for (const marker of ["package.json", "composer.json"]) {
      if (existsSync(join(d, marker))) return d;
    }
    try {
      if (statSync(join(d, ".git")).isDirectory()) return d;
    } catch { /* not a dir */ }
    d = dirname(d);
  }
  return "";
}

/**
 * Detect the project framework from files at *root*.
 *
 * @param root - Project root path.
 * @returns One of nextjs | react | laravel | swift | generic.
 */
export function detectProjectFramework(root: string): string {
  if (["next.config.js", "next.config.ts"].some((c) => isFile(join(root, c)))) return "nextjs";
  const pkg = join(root, "package.json");
  if (isFile(pkg)) {
    try { if (readFileSync(pkg, "utf-8").includes("react")) return "react"; } catch { /* ignore */ }
  }
  if (isFile(join(root, "composer.json")) && isFile(join(root, "artisan"))) return "laravel";
  if (isFile(join(root, "Package.swift"))) return "swift";
  return "generic";
}

/** True when *path* exists and is a regular file. */
function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}
