#!/usr/bin/env bun
// @hook-entry
/**
 * check-laravel-skill.native.ts — native TS port of _legacy_py/check-laravel-skill.py.
 *
 * PreToolUse gate for .php edits (vendor/storage/bootstrap-cache skipped):
 * Phase 1 base Laravel skill, 1.5 FuseCore module skill, Phase 2 domain skills,
 * Phase 3 MCP research. Reuses the shared expert-skill-gate, skill-paths,
 * modular-detection and the laravel trigger detector. Deny/allow + the domain
 * repr match the Python (whitespace aside).
 */
import { dirname } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import {
  skillWasConsulted, specificSkillConsulted as baseSpecific, mcpResearchDone,
  denyBlock, findProjectRootMarkers,
} from "../../core-guards/scripts/_shared/expert-skill-gate";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { isFusecoreProject } from "../../_shared/scripts/modular-detection";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills } from "./laravel-triggers";

const FILE_RE = /\.php$/;
const SKIP_RE = /\/(vendor|storage|bootstrap\/cache)\//;

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const target = editTargets(data).find((t) => FILE_RE.test(t.filePath) && !SKIP_RE.test(t.filePath));
if (!target) process.exit(0);
const filePath = target.filePath;
const content = target.content;

const sessionId = data.session_id || `fallback-${process.pid}`;
const root = findProjectRootMarkers(dirname(filePath), "composer.json", "artisan", ".git");

// Phase 1: base Laravel skill
if (!skillWasConsulted("laravel", sessionId)) {
  denyBlock(
    "BLOCKED: Laravel skill not consulted. READ ONE: "
    + `1) ${skillMd("laravel-expert", "solid-php")}`
    + ` | 2) ${skillMd("laravel-expert", "laravel-eloquent")}`
    + " | 3) Use mcp__context7__query-docs. After reading, retry.");
}

// Phase 1.5: FuseCore module skill enforcement
if (isFusecoreProject(root) && !baseSpecific("laravel", "fusecore", sessionId)) {
  denyBlock(
    "BLOCKED: FuseCore project detected. READ: "
    + `${skillMd("laravel-expert", "fusecore")} `
    + "BEFORE writing code in FuseCore modules.");
}

// Phase 2: domain skills (all .php files)
const required = detectRequiredSkills(content);
const missing = required.filter((s) => !baseSpecific("laravel", s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => skillMd("laravel-expert", s)).join(" | ");
  denyBlock(`BLOCKED: Code uses ${missing.join(", ")} but skill(s) not consulted. READ: ${paths}`);
}

// Phase 3: MCP research (Context7 AND Exa)
if (!mcpResearchDone(sessionId)) {
  denyBlock(
    "BLOCKED: No MCP research done. Use BOTH: "
    + "1) mcp__context7__query-docs AND "
    + "2) mcp__exa__web_search_exa before writing code.");
}

const domain = required.length ? `[${required.map((s) => `'${s}'`).join(", ")}]` : "base";
allowPass("check-laravel-skill", `pass (domain: ${domain})`);
