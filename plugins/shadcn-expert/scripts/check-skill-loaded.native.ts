#!/usr/bin/env bun
// @hook-entry
/**
 * check-skill-loaded.native.ts — native TS port of
 * _legacy_py/check-skill-loaded.py (shadcn skill enforcement).
 *
 * PreToolUse gate on component/ui/config files: Phase 1 base shadcn skill,
 * Phase 2 domain skills, Phase 3 MCP research. Reuses the shared expert-skill-
 * gate, skill-paths and the shadcn trigger detector. allow_pass script name is
 * "check-shadcn-skill" (matching the Python). Deny/allow JSON matches Python.
 */
import { dirname } from "node:path";
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import {
  skillWasConsulted, specificSkillConsulted as baseSpecific, mcpResearchDone,
  denyBlock, findProjectRootMarkers,
} from "../../core-guards/scripts/_shared/expert-skill-gate";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills } from "./shadcn-triggers";

const FILE_RE = /\.(tsx|jsx|css|scss|json)$/;
const SKIP_RE = /\/(node_modules|dist|build)\//;
const PATH_RE = /(components|ui|shadcn|components\.json)/;

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const target = editTargets(data).find((t) => FILE_RE.test(t.filePath) && !SKIP_RE.test(t.filePath));
if (!target) process.exit(0);
const filePath = target.filePath;
if (!PATH_RE.test(filePath)) process.exit(0);

const content = target.content;
const sessionId = data.session_id || `fallback-${process.pid}`;
findProjectRootMarkers(dirname(filePath), "package.json", ".git");

// Phase 1: base shadcn skill
if (!skillWasConsulted("shadcn", sessionId)) {
  denyBlock(
    "BLOCKED: shadcn skill not consulted. READ ONE: "
    + `1) ${skillMd("shadcn-expert", "shadcn-detection")}`
    + ` | 2) ${skillMd("shadcn-expert", "shadcn-components")}`
    + " | 3) Use mcp__shadcn__search_items_in_registries. After reading, retry.");
}

// Phase 2: domain skills
const required = detectRequiredSkills(content);
const missing = required.filter((s) => !baseSpecific("shadcn", s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => skillMd("shadcn-expert", s)).join(" | ");
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
allowPass("check-shadcn-skill", `pass (domain: ${domain})`);
