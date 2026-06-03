#!/usr/bin/env bun
// @hook-entry
/**
 * require-scroll-before-screenshot.native.ts — native TS port of
 * _legacy_py/require-scroll-before-screenshot.py.
 *
 * PreToolUse on screenshot (active design agent only): deny unless a scroll
 * (browser_scroll) happened since the last browser_navigate, per the
 * per-agent tracking file. Deny message matches the Python.
 */
import { gatedAgentId } from "./lib/design-state";
import { scrollDoneSinceLastNav } from "./lib/skill-tracking";

const DENY_MSG =
  "BLOCKED: You must scroll the page before taking a screenshot. "
  + "Use mcp__fuse-browser__browser_scroll with to:'end' to reach the bottom, "
  + "wait via mcp__fuse-browser__browser_wait_for, scroll back to top, "
  + "THEN take a fullPage mcp__fuse-browser__browser_screenshot.";

let data: { agent_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const agentId = gatedAgentId(data.agent_id ?? "");
if (agentId === null) process.exit(0);

if (!scrollDoneSinceLastNav(agentId)) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: DENY_MSG },
  }));
  process.exit(0);
}
process.exit(0);
