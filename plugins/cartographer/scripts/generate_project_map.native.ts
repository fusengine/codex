#!/usr/bin/env bun
// @hook-entry
/**
 * generate_project_map.native.ts — native TS port of
 * _legacy_py/generate_project_map.py. SessionStart: if cwd is a real project
 * (has an indicator file, not home/root), write a navigable tree to
 * .cartographer/project/. Reuses project-indicators + write-recursive (inlined).
 */
import { statSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { EXCLUDE_DIRS, PROJECT_INDICATORS } from "./lib/project-indicators.native";
import { writeTree } from "./lib/write-recursive.native";

function isDir(p: string): boolean {
  try { return statSync(p).isDirectory(); } catch { return false; }
}
function exists(p: string): boolean {
  try { statSync(p); return true; } catch { return false; }
}

/** True if dir is a real project: not home/root and has an indicator (mirrors _is_project). */
function isProject(path: string): boolean {
  const resolved = resolve(path);
  if (resolved === resolve(homedir()) || resolved === "/") return false;
  for (const f of PROJECT_INDICATORS) if (exists(join(resolved, f))) return true;
  return false;
}

/** Count index.md files recursively (mirrors rglob("index.md")). */
function countIndexMd(dir: string): number {
  let count = 0;
  const walk = (d: string): void => {
    let entries: string[];
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const full = join(d, e);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) walk(full);
      else if (st.isFile() && e === "index.md") count++;
    }
  };
  walk(dir);
  return count;
}

try {
  const rawDir = process.argv[2] ?? process.env.CODEX_PROJECT_DIR ?? process.cwd();
  // Python computes the default output from the UN-resolved dir, then resolves
  // project_dir (canonicalizing symlinks) for the scan. Mirror that order.
  const outputDir = process.argv[3] ?? join(rawDir, ".cartographer", "project");
  let projectDir: string;
  try { projectDir = realpathSync(rawDir); } catch { projectDir = resolve(rawDir); }

  if (!isDir(projectDir)) process.exit(0);
  if (!isProject(projectDir)) process.exit(0);

  writeTree(projectDir, outputDir, "", EXCLUDE_DIRS);
  process.stderr.write(`cart project: ${countIndexMd(outputDir)} entries loaded\n`);
} catch {
  /* match the Python: swallow any error silently */
}
