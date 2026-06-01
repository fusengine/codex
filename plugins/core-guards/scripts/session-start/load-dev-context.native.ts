#!/usr/bin/env bun
// @hook-entry
/**
 * load-dev-context.native.ts — native TS port of
 * _legacy_py/session-start/load-dev-context.py.
 *
 * SessionStart: emit git branch + modified files + detected project type as
 * additionalContext. Detection order, the "Project: …" labels, the 5-file
 * truncation and the JSON envelope are faithful to the Python.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

/** Run git read-only, returning trimmed stdout or "" on any failure. */
function git(args: string[]): string {
  try {
    const r = spawnSync("git", args, { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    return r.status === 0 && typeof r.stdout === "string" ? r.stdout.trim() : "";
  } catch {
    return "";
  }
}

/** True when *path* exists and is a regular file. */
function isFile(path: string): boolean {
  try { return statSync(path).isFile(); } catch { return false; }
}

/** True when *path* exists and is a directory. */
function isDir(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

const parts: string[] = [];

if (isDir(".git")) {
  const branch = git(["branch", "--show-current"]) || "unknown";
  parts.push(`Git branch: ${branch}`);
  const status = git(["status", "--porcelain"]);
  if (status) {
    const lines = status.split("\n").slice(0, 5);
    parts.push(`Modified files:\n${lines.join("\n")}`);
  }
}

if (["next.config.js", "next.config.ts", "next.config.mjs"].some(isFile)) {
  parts.push("Project: Next.js");
} else if (isFile("package.json")) {
  parts.push("Project: Node.js");
}

if (isFile("composer.json") && isFile("artisan")) parts.push("Project: Laravel");
if (isFile("Package.swift")) parts.push("Project: Swift");

if (parts.length) {
  console.log(JSON.stringify({ hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: parts.join("\n"),
  } }));
}

process.exit(0);
