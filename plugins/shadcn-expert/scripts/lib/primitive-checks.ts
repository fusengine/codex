/**
 * primitive-checks.ts — TS port of detect_primitive_checks.py.
 *
 * Radix-UI vs Base-UI detection signals (weights match the Python): package.json
 * (40), components.json style (20), import scan (25) + data-attr scan (15), and
 * package-manager detection from lockfiles. grepQuiet uses `grep -rq` like the
 * Python subprocess for byte-identical scan behaviour.
 */
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** True if `pattern` is found recursively under `path` (grep -rq). */
export function grepQuiet(pattern: string, path: string): boolean {
  try {
    const r = Bun.spawnSync(["grep", "-rq", pattern, path], { stdout: "ignore", stderr: "ignore" });
    return r.exitCode === 0;
  } catch {
    return false;
  }
}

/** package.json signals (weight 40 each). Returns [radix, baseui]. */
export function checkPkgJson(root: string, signals: string[]): [number, number] {
  const pkg = join(root, "package.json");
  if (!isFile(pkg)) return [0, 0];
  let radix = 0;
  let baseui = 0;
  try {
    const content = readFileSync(pkg, "utf8");
    if (content.includes('"@radix-ui/react-')) { radix = 40; signals.push("pkg:radix-ui"); }
    if (content.includes('"@base-ui/react')) { baseui = 40; signals.push("pkg:base-ui"); }
  } catch { /* unreadable */ }
  return [radix, baseui];
}

/** components.json style signal (weight 20). Returns [radix, baseui]. */
export function checkComponentsJson(root: string, signals: string[]): [number, number] {
  const cjson = join(root, "components.json");
  if (!isFile(cjson)) return [0, 0];
  try {
    const style = JSON.parse(readFileSync(cjson, "utf8")).style ?? "";
    if (style === "new-york" || style === "default") { signals.push(`style:${style}`); return [20, 0]; }
    if (style === "base-vega") { signals.push("style:base-vega"); return [0, 20]; }
  } catch { /* bad json */ }
  return [0, 0];
}

/** Import scan (25) + data-attr scan (15). Returns [radix, baseui]. */
export function scanImportsAndAttrs(root: string, signals: string[]): [number, number] {
  const dirs = ["src", "components", "app"].map((d) => join(root, d)).filter(isDir);
  let radix = 0;
  let baseui = 0;
  if (dirs.some((d) => grepQuiet("@radix-ui/react-", d))) { radix += 25; signals.push("import:radix"); }
  if (dirs.some((d) => grepQuiet("@base-ui/react", d))) { baseui += 25; signals.push("import:base-ui"); }
  if (dirs.some((d) => grepQuiet("data-state=", d))) { radix += 15; signals.push("attr:data-state"); }
  if (dirs.some((d) => grepQuiet("data-\\[open\\]", d))) { baseui += 15; signals.push("attr:data-[open]"); }
  return [radix, baseui];
}

/** Detect package manager + runner from lockfiles. Returns [pm, runner]. */
export function detectPm(root: string, signals: string[]): [string, string] {
  const table: [string, string, string][] = [
    ["bun.lockb", "bun", "bunx"], ["bun.lock", "bun", "bunx"],
    ["pnpm-lock.yaml", "pnpm", "pnpm dlx"], ["yarn.lock", "yarn", "yarn dlx"],
  ];
  for (const [lock, pm, runner] of table) {
    if (isFile(join(root, lock))) { signals.push(`pm:${pm}`); return [pm, runner]; }
  }
  signals.push("pm:npm");
  return ["npm", "npx"];
}

function isFile(p: string): boolean { try { return statSync(p).isFile(); } catch { return false; } }
function isDir(p: string): boolean { try { return statSync(p).isDirectory(); } catch { return false; } }
