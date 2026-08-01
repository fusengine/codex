#!/usr/bin/env bun
// @hook-entry
/**
 * design-agent-flag.native.ts — native TS port of _legacy_py/design-agent-flag.py.
 *
 * SubagentStart writes the agent_id to the design-agent-active flag; SubagentStop
 * removes it. PreToolUse gates read this flag to know the active design agent.
 * Only reacts to design-expert agents. Flag path matches the Python.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR, FLAG_FILE, flagAgentId } from "./lib/design-state";

const STACK_FILE = join(CACHE_DIR, "design-agent-stack.json");

function loadStack(): string[] {
  if (!existsSync(STACK_FILE)) return [];
  try {
    const value: unknown = JSON.parse(readFileSync(STACK_FILE, "utf8"));
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

function writeStack(stack: string[]): void {
  writeFileSync(STACK_FILE, JSON.stringify(stack), "utf8");
  writeFileSync(FLAG_FILE, stack.at(-1) ?? "", "utf8");
}

let data: { hook_event_name?: string; agent_type?: string; agent_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const agentType = data.agent_type ?? "";
if (!agentType.includes("design-expert") && !agentType.includes("design")) process.exit(0);

mkdirSync(CACHE_DIR, { recursive: true });
if (data.hook_event_name === "SubagentStart") {
  const agentId = data.agent_id ?? "";
  if (!agentId) process.exit(0);
  const stack = loadStack().filter((item) => item !== agentId);
  stack.push(agentId);
  writeStack(stack);
} else if (data.hook_event_name === "SubagentStop" && flagAgentId() === (data.agent_id ?? "")) {
  const stack = loadStack().filter((item) => item !== data.agent_id);
  if (stack.length > 0) {
    writeStack(stack);
  } else {
    for (const path of [FLAG_FILE, STACK_FILE]) {
      try { rmSync(path); } catch { /* already gone */ }
    }
  }
} else if (data.hook_event_name === "SubagentStop") {
  const stack = loadStack().filter((item) => item !== data.agent_id);
  if (stack.length > 0) writeFileSync(STACK_FILE, JSON.stringify(stack), "utf8");
}
process.exit(0);
