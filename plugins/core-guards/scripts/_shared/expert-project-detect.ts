/**
 * expert-project-detect.ts — bundle-safe TS port of
 * _shared/scripts/project_detect.py (the parts the expert post-hooks need).
 *
 * Walks up from a file path to find the project root and detect a Tailwind
 * project (config file or a tailwindcss dependency). Dependency-free so the
 * bundler inlines it into each plugin's hooks.
 */
import { dirname, join, resolve } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";

const TAILWIND_CONFIGS = [
  "tailwind.config.js",
  "tailwind.config.ts",
  "tailwind.config.mjs",
  "tailwind.config.cjs",
];

/** True when path is a regular file. */
function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/**
 * Walk up from file_path to the nearest package.json or Tailwind config dir.
 * @param filePath - File whose project root is sought.
 * @returns Absolute root dir, or "" when none is found within 20 levels.
 */
export function findProjectRoot(filePath: string): string {
  let d = dirname(resolve(filePath));
  for (let i = 0; i < 20; i++) {
    if (isFile(join(d, "package.json"))) return d;
    for (const cfg of TAILWIND_CONFIGS) {
      if (isFile(join(d, cfg))) return d;
    }
    const parent = dirname(d);
    if (parent === d) break;
    d = parent;
  }
  return "";
}

/**
 * Check whether a file belongs to a Tailwind CSS project (v3 or v4).
 * @param filePath - File under test.
 * @returns True when a config exists or tailwindcss is a (dev)dependency.
 */
export function isTailwindProject(filePath: string): boolean {
  const root = findProjectRoot(filePath);
  if (!root) return false;
  for (const cfg of TAILWIND_CONFIGS) {
    if (isFile(join(root, cfg))) return true;
  }
  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      return "tailwindcss" in deps;
    } catch {
      /* fall through */
    }
  }
  return false;
}
