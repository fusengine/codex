#!/usr/bin/env bun
// @hook-entry
/**
 * design-agent-flag.native.ts — native TS port of _legacy_py/design-agent-flag.py.
 *
 * SubagentStart writes the agent_id to the design-agent-active flag; SubagentStop
 * removes it. PreToolUse gates read this flag to know the active design agent.
 * Only reacts to design-expert agents. Flag path matches the Python.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FLAG_DIR = join(homedir(), ".codex", "fusengine");
const FLAG_FILE = join(FLAG_DIR, "design-agent-active");

let data: { hook_event_name?: string; agent_type?: string; agent_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const agentType = data.agent_type ?? "";
if (!agentType.includes("design-expert") && !agentType.includes("design")) process.exit(0);

mkdirSync(FLAG_DIR, { recursive: true });
if (data.hook_event_name === "SubagentStart") {
  writeFileSync(FLAG_FILE, data.agent_id ?? "");
} else if (data.hook_event_name === "SubagentStop") {
  try { rmSync(FLAG_FILE); } catch { /* already gone */ }
}
process.exit(0);
