#!/usr/bin/env bun
// @hook-entry
/**
 * validate-nextjs-solid.native.ts — native TS port of _legacy_py/validate-nextjs-solid.py.
 *
 * PreToolUse(apply_patch): for each edited Next.js TS file (project has a
 * next.config.*), flag SOLID violations — over line limit (150 for route
 * convention files, else 100), interface/type in a component, or client hooks
 * without a top-of-file 'use client'. Reuses shared countCodeLines /
 * denySolidViolation. The thresholds, regexes and messages are verbatim.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { findProjectRootMarkers } from "../../core-guards/scripts/_shared/expert-skill-gate";
import { countCodeLines, denySolidViolation } from "../../core-guards/scripts/_shared/validate-solid-common";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const NEXT_CONFIG = ["next.config.js", "next.config.ts", "next.config.mjs"];

/** True if the file lives in a Next.js project (a next.config.* at root). */
function isNextProject(filePath: string): boolean {
  const root = findProjectRootMarkers(dirname(filePath), "package.json", ".git");
  return NEXT_CONFIG.some((f) => existsSync(join(root, f)));
}

/** Existing file content if present, else the patch content (prefer_existing). */
function fullFile(filePath: string, patchContent: string): string {
  try {
    if (existsSync(filePath)) return readFileSync(filePath, "utf-8");
  } catch { /* ignore */ }
  return patchContent;
}

/** Compute SOLID violations for a Next.js file. */
function violationsOf(fp: string, content: string, full: string): string[] {
  const out: string[] = [];
  const maxLines = /(page|layout|loading|error|not-found)\.(tsx|ts)$/.test(fp) ? 150 : 100;
  const lineCount = countCodeLines(full);
  if (lineCount > maxLines) {
    out.push(`File has ${lineCount} lines (limit: ${maxLines}). Split to lib/, hooks/, or components/.`);
  }
  if (/\/(app|components|modules)\//.test(fp) && !/\/interfaces\//.test(fp)
      && /^(export )?(interface|type) [A-Z]/m.test(content)) {
    out.push("Interface/type in component. Move to modules/[feature]/src/interfaces/.");
  }
  if (/(useState|useEffect|useRef|onClick|onChange)/.test(content)) {
    const firstLines = full.split("\n").slice(0, 5).join("\n");
    if (!firstLines.includes("'use client'") && !firstLines.includes('"use client"')) {
      out.push("Client hooks detected but 'use client' directive missing at top.");
    }
  }
  return out;
}

let data: Parameters<typeof editTargets>[0];
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

for (const t of editTargets(data)) {
  const fp = t.filePath;
  if (!/\.(tsx|ts|jsx|js)$/.test(fp) || /\/(node_modules|dist|build|\.next)\//.test(fp)) continue;
  if (!isNextProject(fp)) continue;
  const content = t.content;
  if (!content) continue;
  const v = violationsOf(fp, content, fullFile(fp, content));
  if (v.length) denySolidViolation(fp, v);
}
allowPass("validate-nextjs-solid", "SOLID ok");
