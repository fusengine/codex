#!/usr/bin/env bun
// @hook-entry
/**
 * track-skill-read.native.ts — native TS port of _legacy_py/track-skill-read.py
 * (design-expert).
 *
 * PostToolUse: record a skill-read for framework "design" into the APEX day-state
 * (shared trackSkillRead). If a design agent is active, also flip
 * templates_read / inspiration_read in its pipeline state when the read targets
 * identity templates / design-inspiration. Paths + flags match the Python.
 */
import { existsSync } from "node:fs";
import { skillDocPathFromPayload } from "../../core-guards/scripts/_shared/shell-read-paths";
import { trackSkillRead } from "../../core-guards/scripts/_shared/expert-skill-tracking";
import { FLAG_FILE, flagAgentId, loadState, saveState } from "./lib/design-state";

let data: { session_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const filePath = skillDocPathFromPayload(data);
if (!/skills\/.*\.(md|txt)$/.test(filePath)) process.exit(0);

const sessionId = data.session_id || `fallback-${process.pid}`;
trackSkillRead("design", "skill:Read", filePath, sessionId);

if (!existsSync(FLAG_FILE)) process.exit(0);
const agentId = flagAgentId();
if (!agentId) process.exit(0);
const state = loadState(agentId);
if (!state) process.exit(0);
if (filePath.includes("identity-system") || filePath.includes("0-identity-system")) state.templates_read = true;
if (filePath.includes("design-inspiration")) state.inspiration_read = true;
saveState(state);
process.exit(0);
