#!/usr/bin/env bun
// @hook-entry
/**
 * check-skill-loaded.native.ts — native TS port of
 * _legacy_py/check-skill-loaded.py (React skill enforcement).
 *
 * PreToolUse gate: Phase 1 base React skill, Phase 2 domain skills (shadcn
 * filtered out for non-shadcn projects), Phase 3 MCP research. Next.js files are
 * skipped (handled by nextjs-expert). Reuses the shared expert-skill-gate,
 * skill-paths, shadcn-patterns and the react trigger detector. Deny/allow JSON
 * matches the Python (whitespace aside).
 */
import { dirname } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import {
  skillWasConsulted, specificSkillConsulted as baseSpecific, mcpResearchDone,
  denyBlock, findProjectRootMarkers,
} from "../../core-guards/scripts/_shared/expert-skill-gate";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { isShadcnProject } from "../../_shared/scripts/shadcn-patterns";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills } from "./react-triggers";

const FILE_RE = /\.(tsx|ts|jsx|js)$/;
const SKIP_RE = /\/(node_modules|dist|build)\//;
const NEXTJS_RE = /(use client|use server|NextRequest|NextResponse|from ['"]next)/;
const REACT_RE = /(useState|useEffect|useContext|useReducer|from ['"]react)/;

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
if (NEXTJS_RE.test(content)) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
const projectRoot = findProjectRootMarkers(dirname(filePath), "package.json", ".git");

// Phase 1: base React skill (only when React patterns present)
if (REACT_RE.test(content) && !skillWasConsulted("react", sessionId)) {
  denyBlock(
    "BLOCKED: React skill not consulted. READ ONE: "
    + `1) ${skillMd("react-expert", "solid-react")}`
    + ` | 2) ${skillMd("react-expert", "react-19")}`
    + " | 3) Use mcp__context7__query-docs. After reading, retry.");
}

// Phase 2: domain skills (all .ts/.tsx)
let required = detectRequiredSkills(content);
if (!isShadcnProject(projectRoot)) required = required.filter((s) => s !== "react-shadcn");
const missing = required.filter((s) => !baseSpecific("react", s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => skillMd("react-expert", s)).join(" | ");
  denyBlock(`BLOCKED: Code uses ${missing.join(", ")} but skill(s) not consulted. READ: ${paths}`);
}

// Phase 3: MCP research (Context7 AND Exa)
if (!mcpResearchDone(sessionId)) {
  denyBlock(
    "BLOCKED: No MCP research done. Use BOTH: "
    + "1) mcp__context7__query-docs AND "
    + "2) mcp__exa__web_search_exa before writing code.");
}

// Match Python's f"{required or 'base'}": list repr when non-empty, else "base".
const domain = required.length ? `[${required.map((s) => `'${s}'`).join(", ")}]` : "base";
allowPass("check-skill-loaded", `pass (domain: ${domain})`);
