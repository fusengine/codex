#!/usr/bin/env bun
// @hook-entry
/**
 * check-nextjs-skill.native.ts — native TS port of _legacy_py/check-nextjs-skill.py.
 *
 * PreToolUse gate: Phase 1 base Next.js skill, 1.5 modular skill (modules/),
 * Phase 2 domain skills (shadcn filtered for non-shadcn projects), Phase 3 MCP
 * research. Reuses the shared expert-skill-gate, skill-paths, shadcn-patterns,
 * modular-detection and the nextjs trigger detector. Deny/allow + the domain
 * repr match the Python (whitespace aside).
 */
import { dirname } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import {
  skillWasConsulted, specificSkillConsulted as baseSpecific, mcpResearchDone,
  denyBlock, findProjectRootMarkers,
} from "../../core-guards/scripts/_shared/expert-skill-gate";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { isShadcnProject } from "../../_shared/scripts/shadcn-patterns";
import { isNextjsModular } from "../../_shared/scripts/modular-detection";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills } from "./nextjs-triggers";

const FILE_RE = /\.(tsx|ts|jsx|js)$/;
const SKIP_RE = /\/(node_modules|dist|build|\.next)\//;
const NEXTJS_RE = /(use client|use server|NextRequest|NextResponse)/;
const IMPORT_RE = /(from ['"]next|getServerSideProps|getStaticProps)/;
const NAME_RE = /(page|layout|loading|error|route|middleware)\.(ts|tsx)$/;

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
const root = findProjectRootMarkers(dirname(filePath), "package.json", ".git");

// Phase 1: base Next.js skill (when Next.js patterns present)
if ((NEXTJS_RE.test(content) || IMPORT_RE.test(content) || NAME_RE.test(filePath))
    && !skillWasConsulted("nextjs", sessionId)) {
  denyBlock(
    "BLOCKED: Next.js skill not consulted. READ ONE: "
    + `1) ${skillMd("nextjs-expert", "solid-nextjs")}`
    + ` | 2) ${skillMd("nextjs-expert", "nextjs-16")}`
    + " | 3) Use mcp__context7__query-docs. After reading, retry.");
}

// Phase 1.5: modular architecture skill enforcement
if (isNextjsModular(root) && !baseSpecific("nextjs", "solid-nextjs", sessionId)) {
  denyBlock(
    "BLOCKED: Modular Next.js (modules/ exists). READ: "
    + `${skillMd("nextjs-expert", "solid-nextjs")} `
    + "BEFORE writing code. Modular architecture REQUIRED.");
}

// Phase 2: domain skills (skip shadcn if no components.json)
let required = detectRequiredSkills(content);
if (!isShadcnProject(root)) required = required.filter((s) => s !== "nextjs-shadcn");
const missing = required.filter((s) => !baseSpecific("nextjs", s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => skillMd("nextjs-expert", s)).join(" | ");
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
allowPass("check-nextjs-skill", `pass (domain: ${domain})`);
