#!/usr/bin/env bun
// @hook-entry
/**
 * check-swift-skill.native.ts — native TS port of _legacy_py/check-swift-skill.py.
 * PreToolUse gate: base Swift skill → domain skills → MCP research, denying with
 * byte-identical reasons. Reuses the shared expert-skill gate + skill-paths;
 * firstTarget is local (mirrors first_edit_target with the .swift filters).
 */
import { iterEditTargets } from "../../core-guards/scripts/_shared/track-edit-targets";
import { skillMd } from "../../core-guards/scripts/_shared/skill-paths";
import { skillWasConsulted, mcpResearchDone, denyBlock } from "../../core-guards/scripts/_shared/expert-skill-gate";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";
import { detectRequiredSkills, specificSkillConsulted } from "./swift-skill-triggers.native";

const FILE_RE = /\.swift$/;
const SKIP_RE = /\/(\.build|DerivedData|Pods)\//;

/** First edited .swift target not under a build dir (mirrors first_edit_target). */
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
const content = target.content;
const sessionId = data.session_id || `fallback-${process.pid}`;

if (!skillWasConsulted("swift", sessionId)) {
  denyBlock(
    "BLOCKED: Swift skill not consulted. READ ONE: " +
    `1) ${skillMd("swift-apple-expert", "solid-swift")}` +
    ` | 2) ${skillMd("swift-apple-expert", "swiftui-core")}` +
    " | 3) Use mcp__context7__query-docs (topic: swiftui). After reading, retry.");
}

const required = detectRequiredSkills(content);
const missing = required.filter((s) => !specificSkillConsulted(s, sessionId));
if (missing.length) {
  const paths = missing.map((s) => `${skillMd("swift-apple-expert", s)}`).join(" | ");
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
allowPass("check-swift-skill", `pass (domain: ${domain})`);
