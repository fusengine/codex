#!/usr/bin/env bun
// @hook-entry
/**
 * validate-design-system.native.ts — native TS port of
 * _legacy_py/validate-design-system.py.
 *
 * PreToolUse on mcp__gemini-design__create_frontend: locate design-system.md
 * (walk up 6 dirs), deny if missing or too generic (needs ## Design Reference,
 * a URL, an oklch() with chroma > 0, no forbidden fonts). On success, advance the
 * agent state to phase 3 and allow_pass. Messages/regex match the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { FLAG_FILE, flagAgentId, loadState, saveState, deny } from "./lib/design-state";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const FORBIDDEN_FONTS = ["Inter", "Roboto", "Arial", "Open Sans"];
const OKLCH_RE = /oklch\(\s*[\d.]+%?\s+0\.0*[1-9]/;
const URL_RE = /https?:\/\//;
const DENY_NOT_FOUND =
  "BLOCKED: design-system.md not found. RECOVERY: 1) Read identity templates "
  + "2) Read design-inspiration.md 3) Browse 4 sites via Playwright "
  + "4) Write design-system.md with ## Design Reference, OKLCH, typography, URL "
  + "5) Retry mcp__gemini-design__create_frontend";

/** Walk up to 6 parents from cwd looking for design-system.md. */
function findDesignSystem(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "design-system.md");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Return missing requirements in design-system.md content. */
function validateContent(content: string): string[] {
  const missing: string[] = [];
  if (!content.includes("## Design Reference")) missing.push("## Design Reference section");
  if (!URL_RE.test(content)) missing.push("reference URL (https://...)");
  if (!OKLCH_RE.test(content)) missing.push("oklch() color with chroma > 0");
  if (FORBIDDEN_FONTS.some((f) => content.includes(f))) missing.push("forbidden font found (Inter/Roboto/Arial/Open Sans)");
  return missing;
}

let data: { tool_name?: string; agent_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (data.tool_name !== "mcp__gemini-design__create_frontend") process.exit(0);
const dsPath = findDesignSystem();
if (!dsPath) deny(DENY_NOT_FOUND);

let content: string;
try {
  content = readFileSync(dsPath!, "utf8");
} catch {
  process.exit(0);
}

const missing = validateContent(content);
if (missing.length) {
  deny(`BLOCKED: design-system.md too generic. Missing: ${missing.join(", ")}. `
    + "RECOVERY: 1) Fix incomplete sections 2) Add ## Design Reference with URL "
    + "3) Ensure oklch() chroma > 0.05 4) Replace forbidden fonts "
    + "5) Retry mcp__gemini-design__create_frontend");
}

let agentId = data.agent_id || "";
if (!agentId && existsSync(FLAG_FILE)) agentId = flagAgentId();
if (agentId) {
  const state = loadState(agentId);
  if (state) {
    state.design_system_exists = true;
    state.design_system_valid = true;
    state.current_phase = Math.max(state.current_phase ?? 0, 3);
    saveState(state);
  }
}
allowPass("validate-design-system", "design-system.md ok");
