#!/usr/bin/env bun
// @hook-entry
/**
 * track-skill-read.native.ts — native TS port of _legacy_py/track-skill-read.py.
 *
 * PostToolUse: when a Read (or shell read) touches a skills/*.md|txt file, record
 * a skill-read for framework "react" into the APEX day-state. Reuses the shared
 * skillDocPathFromPayload + trackSkillRead so the state side-effect matches.
 */
import { skillDocPathFromPayload } from "../../core-guards/scripts/_shared/shell-read-paths";
import { trackSkillRead } from "../../core-guards/scripts/_shared/expert-skill-tracking";

const FRAMEWORK = "react";

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const filePath = skillDocPathFromPayload(data);
if (!/skills\/.*\.(md|txt)$/.test(filePath)) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
trackSkillRead(FRAMEWORK, "skill:Read", filePath, sessionId);
process.exit(0);
