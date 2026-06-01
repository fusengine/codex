#!/usr/bin/env bun
// @hook-entry
/**
 * check-inspiration-read.native.ts — native TS port of
 * _legacy_py/check-inspiration-read.py.
 *
 * PreToolUse on mcp__playwright__browser_navigate (active design agent only):
 * require Phase 0 (identity-system) and inspiration-catalog reads, and a URL
 * from the known inspiration domains. Deny messages + skill paths match Python.
 */
import { homedir } from "node:os";
import { gatedAgentId, deny } from "./lib/design-state";
import { trackingHas } from "./lib/skill-tracking";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const SKILLS = `${homedir()}/.codex/plugins/cache/fusengine-codex/design-expert/skills`;
const KNOWN_DOMAINS = [
  "framer.website", "webflow.io", "awwwards.com", "godly.website",
  "lapa.ninja", "onepagelove.com", "saasframe.io", "bestwebsite.gallery",
  "landingfolio.com",
];

let data: { session_id?: string; agent_id?: string; tool_name?: string; tool_input?: { url?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (gatedAgentId(data.agent_id ?? "") === null) process.exit(0);
if (data.tool_name !== "mcp__playwright__browser_navigate") process.exit(0);

const sid = data.session_id || `fallback-${process.pid}`;

if (!trackingHas(sid, "identity-system")) {
  deny(`BLOCKED: Phase 0 not done. READ: ${SKILLS}/0-identity-system/SKILL.md first.`);
}
if (!trackingHas(sid, "design-inspiration")) {
  deny(`BLOCKED: Read inspiration catalog first. READ: ${SKILLS}/1-designing-systems/references/design-inspiration.md + design-inspiration-urls.md`);
}

const url = data.tool_input?.url ?? "";
if (url && !KNOWN_DOMAINS.some((d) => url.includes(d))) {
  deny(`BLOCKED: '${url}' not in catalog. Use URLs from design-inspiration-urls.md. Domains: ${KNOWN_DOMAINS.join(", ")}`);
}

allowPass("check-inspiration-read", `pass (${url})`);
