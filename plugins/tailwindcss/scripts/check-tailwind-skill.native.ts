#!/usr/bin/env bun
// @hook-entry
/**
 * check-tailwind-skill.native.ts — native TS port of
 * _legacy_py/check-tailwind-skill.py. PreToolUse gate: base Tailwind skill →
 * domain skills → MCP research, denying with the same byte-identical reasons.
 * Reuses the shared expert-skill gate + skill-paths; firstEditTarget is local.
 */
import { iterEditTargets } from "../../core-guards/scripts/_shared/track-edit-targets";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { skillWasConsulted, mcpResearchDone, denyBlock } from "../../core-guards/scripts/_shared/expert-skill-gate";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills, specificSkillConsulted } from "./tailwind-skill-triggers.native";

const TW_PATTERN = /(className|class).*['"].*\b(flex|grid|p-|m-|w-|h-|text-|bg-|border-)/;
const FILE_RE = /\.(tsx|jsx|css|html)$/;
const SKIP_RE = /\/(node_modules|dist|build)\//;

/** First edited target matching the file filter and not the skip filter. */
function firstTarget(data: Parameters<typeof iterEditTargets>[0]) {
  for (const t of iterEditTargets(data)) {
    if (FILE_RE.test(t.file_path) && !SKIP_RE.test(t.file_path)) return t;
  }
  return null;
}

let data: Parameters<typeof iterEditTargets>[0] & { session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const target = firstTarget(data);
if (!target) process.exit(0);
const filePath = target.file_path;
// Vanilla HTML/CSS files: skip Tailwind checks (design-expert emits those).
if (/\.(html|css)$/.test(filePath)) process.exit(0);
const content = target.content;
if (!TW_PATTERN.test(content)) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;

if (!skillWasConsulted("tailwind", sessionId)) {
  denyBlock(
    "BLOCKED: Tailwind skill not consulted. READ ONE: " +
    `1) ${skillMd("tailwindcss", "tailwindcss-v4")}` +
    ` | 2) ${skillMd("tailwindcss", "tailwindcss-utilities")}` +
    " | 3) Use mcp__context7__query-docs (topic: tailwindcss). After reading, retry.");
}

const required = detectRequiredSkills(content);
const missing = required.filter((s) => !specificSkillConsulted(s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => `${skillMd("tailwindcss", s)}`).join(" | ");
  denyBlock(`BLOCKED: Code uses ${missing.join(", ")} but skill(s) not consulted. READ: ${paths}`);
}

if (!mcpResearchDone(sessionId)) {
  denyBlock(
    "BLOCKED: No MCP research done. Use BOTH: " +
    "1) mcp__context7__query-docs AND " +
    "2) mcp__exa__web_search_exa before writing code.");
}

// Mirror Python f"{required or 'base'}": list repr when non-empty, else 'base'.
const domain = required.length ? `[${required.map((s) => `'${s}'`).join(", ")}]` : "base";
allowPass("check-tailwind-skill", `pass (domain: ${domain})`);
