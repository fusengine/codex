#!/usr/bin/env bun
// @hook-entry
/**
 * check-design-skill.native.ts — native TS port of _legacy_py/check-design-skill.py.
 *
 * PreToolUse gate: skip .html/.css (design writes vanilla); require a UI path or
 * JSX/Tailwind className to engage. Phase 1 base design skill, Phase 2 domain
 * skills, Phase 3 MCP research. Reuses expert-skill-gate, skill-paths and the
 * design trigger detector. allow detail reproduces the Python list repr.
 */
import { dirname } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import {
  skillWasConsulted, specificSkillConsulted as baseSpecific, mcpResearchDone,
  denyBlock, findProjectRootMarkers,
} from "../../core-guards/scripts/_shared/expert-skill-gate";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills } from "./lib/design-triggers";

const FILE_RE = /\.(tsx|jsx|css|scss|html)$/;
const SKIP_RE = /\/(node_modules|dist|build)\//;
const HTML_CSS_RE = /\.(html|css)$/;
const UI_PATH_RE = /(components|ui|styles|page|layout|content|view|feature|section|hero|footer|header|sidebar|nav|modal|dialog)/;
const TAILWIND_RE = /className\s*=.*(?:flex|grid|p-|m-|bg-|text-|rounded|shadow|border|gap-|w-|h-)/;

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const target = editTargets(data).find((t) => FILE_RE.test(t.filePath) && !SKIP_RE.test(t.filePath));
if (!target) process.exit(0);
const filePath = target.filePath;
if (HTML_CSS_RE.test(filePath)) process.exit(0);

const content = target.content;
if (!UI_PATH_RE.test(filePath) && !TAILWIND_RE.test(content)) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
findProjectRootMarkers(dirname(filePath), "package.json", ".git");

if (!skillWasConsulted("design", sessionId)) {
  denyBlock(
    "BLOCKED: Design skill not consulted. READ ONE: "
    + `1) ${skillMd("design-expert", "3-generating-components")}`
    + ` | 2) ${skillMd("design-expert", "1-designing-systems")}`
    + " | 3) Use mcp__context7__query-docs. After reading, retry.");
}

const required = detectRequiredSkills(content);
const missing = required.filter((s) => !baseSpecific("design", s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => skillMd("design-expert", s)).join(" | ");
  denyBlock(`BLOCKED: Code uses ${missing.join(", ")} but skill(s) not consulted. READ: ${paths}`);
}

if (!mcpResearchDone(sessionId)) {
  denyBlock(
    "BLOCKED: No MCP research done. Use BOTH: "
    + "1) mcp__context7__query-docs AND "
    + "2) mcp__exa__web_search_exa before writing code.");
}

const domain = required.length ? `[${required.map((s) => `'${s}'`).join(", ")}]` : "base";
allowPass("check-design-skill", `pass (domain: ${domain})`);
