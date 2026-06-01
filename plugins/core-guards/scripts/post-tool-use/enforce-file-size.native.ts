#!/usr/bin/env bun
// @hook-entry
/**
 * enforce-file-size.native.ts (post-tool-use) — native TS port of
 * _legacy_py/post-tool-use/enforce-file-size.py.
 *
 * PostToolUse: warn (additionalContext, no deny) when the edited file exceeds
 * 100 lines. Distinct from the pre-tool-use enforce-file-size: this one inspects
 * the file on disk after the write and uses a different SOLID_REF_MAP. Map, line
 * count and reason string are verbatim from the Python for strict parity.
 */
import { existsSync, statSync, readFileSync } from "node:fs";
import { basename } from "node:path";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$/;
const SOLID_REF_MAP: Record<string, string> = {
  ts: "react", tsx: "react", js: "react", jsx: "react",
  php: "laravel-expert/skills/solid-php/",
  swift: "swift-apple-expert/skills/solid-swift/",
  py: "generic/solid-python/",
  go: "generic/solid-go/",
};

/** Routed SOLID reference for a file (mirrors get_solid_reference). */
function getSolidReference(filePath: string): string {
  const ext = filePath.includes(".") ? filePath.slice(filePath.lastIndexOf(".") + 1) : "";
  if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    for (const cfg of ["next.config.js", "next.config.ts", "next.config.mjs"]) {
      if (existsSync(cfg)) return "nextjs-expert/skills/solid-nextjs/";
    }
    return "react-expert/skills/solid-react/";
  }
  return SOLID_REF_MAP[ext] ?? "generic/";
}

/** Count lines like Python `sum(1 for _ in open(...))` (no trailing-newline line). */
function lineCount(path: string): number {
  const t = readFileSync(path, "utf-8");
  if (t === "") return 0;
  return t.split("\n").length - (t.endsWith("\n") ? 1 : 0);
}

let data: { tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const filePath = data.tool_input?.file_path ?? "";
if (!filePath || !CODE_EXT.test(filePath) || !existsSync(filePath) || !statSync(filePath).isFile()) {
  process.exit(0);
}

let lines: number;
try {
  lines = lineCount(filePath);
} catch {
  process.exit(0);
}

if (lines > 100) {
  const filename = basename(filePath);
  const solidRef = getSolidReference(filePath);
  const plugins = "~/.codex/plugins/cache/fusengine-codex";
  const reason = `SOLID VIOLATION: '${filename}' has ${lines} lines (max: 100). `
    + `ACTION REQUIRED: 1) Read SOLID principles: ${plugins}/${solidRef} `
    + "2) Split this file into smaller modules (<90 lines each) "
    + "3) Follow Single Responsibility Principle.";
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: reason },
  }));
}
process.exit(0);
