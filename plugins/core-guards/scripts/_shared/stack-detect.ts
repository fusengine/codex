/**
 * stack-detect.ts — cwd-based project-stack predicates for the SOLID validators.
 *
 * Each stack validator (laravel/swift/nextjs/react/fusecore) early-exits (empty stdout,
 * exit 0) when the working project is NOT its stack, so a JS project never runs the
 * swift/laravel checks per apply_patch. Marker logic mirrors detect_project_type
 * (package.json / composer.json+artisan / Package.swift / next.config.*), and matches how
 * the existing session hooks already assume cwd is the project root. Dependency-free so the
 * bundler inlines it into each plugin's hooks.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Merged dependencies + devDependencies from a package.json, or {} on failure. */
function pkgDeps(dir: string): Record<string, string> {
  try {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  } catch {
    return {};
  }
}

/** True for a Next.js project (a next.config.* file at the root). */
export function isNextProject(dir = "."): boolean {
  return ["next.config.js", "next.config.ts", "next.config.mjs", "next.config.cjs"].some((f) =>
    existsSync(join(dir, f)),
  );
}

/** True for a Laravel project (composer.json + artisan). Also covers FuseCore. */
export function isLaravelProject(dir = "."): boolean {
  return existsSync(join(dir, "composer.json")) && existsSync(join(dir, "artisan"));
}

/** True for a Swift project (Package.swift or a *.xcodeproj bundle). */
export function isSwiftProject(dir = "."): boolean {
  if (existsSync(join(dir, "Package.swift"))) return true;
  try {
    return readdirSync(dir).some((f) => f.endsWith(".xcodeproj"));
  } catch {
    return false;
  }
}

/** True for a React (non-Next) project: `react` in deps and no next.config. */
export function isReactProject(dir = "."): boolean {
  return "react" in pkgDeps(dir) && !isNextProject(dir);
}
