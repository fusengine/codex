#!/usr/bin/env bun
// @hook-entry
/**
 * post-edit-typescript.native.ts — native TS port of
 * _legacy_py/post-tool-use/post-edit-typescript.py.
 *
 * PostToolUse: run eslint --no-fix + prettier --check (report only, never
 * modify) on edited .ts/.tsx files and surface issues as additionalContext.
 * Tool detection, report wording and the 10s timeout match the Python.
 */
import { statSync } from "node:fs";
import { basename } from "node:path";
import { iterEditTargets } from "../_shared/track-edit-targets";

const TS_EXT = /\.(ts|tsx)$/;
const TIMEOUT_MS = 10_000;

/** True when an executable is resolvable on PATH (mirrors shutil.which). */
function which(bin: string): boolean {
  return Bun.which(bin) !== null;
}

/** Run a command with a timeout; return {code, stdout} (empty on failure). */
async function run(cmd: string[]): Promise<{ code: number; stdout: string }> {
  try {
    const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
    const timer = setTimeout(() => proc.kill(), TIMEOUT_MS);
    const stdout = await new Response(proc.stdout).text();
    const code = await proc.exited;
    clearTimeout(timer);
    return { code, stdout };
  } catch {
    return { code: 0, stdout: "" };
  }
}

let data: Parameters<typeof iterEditTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const files = iterEditTargets(data)
  .map((t) => t.file_path)
  .filter((fp) => TS_EXT.test(fp) && isFile(fp));
if (files.length === 0) process.exit(0);

const issues: string[] = [];

if (which("eslint")) {
  for (const fp of files) {
    const { code, stdout } = await run(["eslint", "--no-fix", "--format", "compact", fp]);
    if (code !== 0 && stdout.trim()) issues.push(`ESLint:\n${stdout.trim()}`);
  }
}

if (which("prettier")) {
  for (const fp of files) {
    const { code } = await run(["prettier", "--check", fp]);
    if (code !== 0) issues.push(`Prettier: ${basename(fp)} needs formatting`);
  }
}

if (issues.length) {
  const report = issues.join(" | ");
  const names = files.map((fp) => basename(fp)).join(", ");
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse",
    additionalContext: `Lint issues in ${names}: ${report}` } }));
}

process.exit(0);

/** True when *path* exists and is a regular file. */
function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}
