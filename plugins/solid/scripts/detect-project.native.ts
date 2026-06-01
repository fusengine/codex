#!/usr/bin/env bun
// @hook-entry
/**
 * detect-project.native.ts — native TS port of _legacy_py/detect-project.py.
 *
 * SessionStart: detect the project type from marker files in
 * CODEX_PROJECT_DIR, print "SOLID: <type> project (max N lines)" and append
 * SOLID_PROJECT_TYPE/FILE_LIMIT/INTERFACE_DIR exports to CLAUDE_ENV_FILE. Check
 * order, grep substrings, limits, interface dirs and the Swift fallback are
 * verbatim from the Python for parity.
 */
import { existsSync, statSync, readFileSync, readdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

type Detection = [type: string, limit: number, ifaceDir: string];

const CHECKS: Array<[file: string, grep: string | null, ...Detection]> = [
  ["package.json", "next", "nextjs", 150, "modules/cores/interfaces"],
  ["composer.json", "laravel", "laravel", 100, "app/Contracts"],
  ["go.mod", null, "go", 100, "internal/interfaces"],
  ["Cargo.toml", null, "rust", 100, "src/traits"],
  ["pyproject.toml", null, "python", 100, "src/interfaces"],
  ["requirements.txt", null, "python", 100, "src/interfaces"],
];

/** Detect project type, file limit and interface dir from markers. */
function detectProject(dir: string): Detection {
  for (const [file, grep, type, limit, ifaceDir] of CHECKS) {
    const fpath = join(dir, file);
    if (!existsSync(fpath) || !statSync(fpath).isFile()) continue;
    if (grep !== null) {
      try {
        if (!readFileSync(fpath, "utf-8").includes(grep)) continue;
      } catch {
        continue;
      }
    }
    return [type, limit, ifaceDir];
  }
  if (existsSync(join(dir, "Package.swift"))) return ["swift", 150, "Protocols"];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.endsWith(".xcodeproj") || entry.endsWith(".xcworkspace")) {
        return ["swift", 150, "Protocols"];
      }
    }
  } catch { /* ignore */ }
  return ["unknown", 100, ""];
}

const projectDir = process.env.CODEX_PROJECT_DIR ?? ".";
const envFile = process.env.CLAUDE_ENV_FILE ?? "";
const [type, limit, ifaceDir] = detectProject(projectDir);

if (type !== "unknown") console.log(`SOLID: ${type} project (max ${limit} lines)`);
if (envFile) {
  try {
    appendFileSync(
      envFile,
      `export SOLID_PROJECT_TYPE=${type}\nexport SOLID_FILE_LIMIT=${limit}\nexport SOLID_INTERFACE_DIR=${ifaceDir}\n`,
    );
  } catch { /* best-effort */ }
}
process.exit(0);
