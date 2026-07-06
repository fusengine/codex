#!/usr/bin/env bun
// @hook-entry
/**
 * track-skill-read.native.ts — native TS port of _legacy_py/track-skill-read.py.
 * PostToolUse: when a Read/shell command touches a skills/*.md|txt doc, record it
 * under framework "nextjs" in the APEX state. Reuses shared shell-read-paths +
 * expert-skill-tracking.
 */
import { skillDocPathFromPayload } from "../../core-guards/scripts/_shared/shell-read-paths";
import { trackSkillRead } from "../../core-guards/scripts/_shared/expert-skill-tracking";

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const filePath = skillDocPathFromPayload(data);
if (!/skills\/.*\.(md|txt)$/.test(filePath)) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
trackSkillRead("nextjs", "skill:Read", filePath, sessionId);
