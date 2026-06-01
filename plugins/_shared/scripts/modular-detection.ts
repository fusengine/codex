/**
 * modular-detection.ts — bundle-safe TS port of _shared/scripts/modular_detection.py.
 *
 * Detects the two modular architectures the expert hooks care about: FuseCore
 * (Laravel) and modules/ (Next.js). Pure fs checks, dependency-free for inlining.
 * Behaviour (markers, AND conditions) is verbatim with the Python.
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

/** True if dir is a directory (false on any stat error). */
function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** True when a Laravel project uses the FuseCore modular architecture. */
export function isFusecoreProject(directory = "."): boolean {
  return isDir(join(directory, "FuseCore")) && existsSync(join(directory, "artisan"))
    && statSync(join(directory, "artisan")).isFile();
}

/** True when a Next.js project uses the modules/ architecture. */
export function isNextjsModular(directory = "."): boolean {
  const hasModules = isDir(join(directory, "modules"));
  const hasNext = ["next.config.js", "next.config.ts", "next.config.mjs"]
    .some((f) => existsSync(join(directory, f)) && statSync(join(directory, f)).isFile());
  return hasModules && hasNext;
}
