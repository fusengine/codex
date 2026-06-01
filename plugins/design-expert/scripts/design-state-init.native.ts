#!/usr/bin/env bun
// @hook-entry
/**
 * design-state-init.native.ts — native TS port of _legacy_py/design-state-init.py.
 *
 * SubagentStart(design): create .design-state-<agent_id>.json with the initial
 * pipeline schema. Mode is detected from the prompt (component) / a cwd
 * design-system.md (page) / else full. Uses the shared defaultState + saveState.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CACHE_DIR, defaultState, isoNow } from "./lib/design-state";

/** Detect pipeline mode: component | page | full. */
function detectMode(prompt: string): string {
  const p = prompt.toLowerCase();
  if (["component", "composant", "snippet"].some((kw) => p.includes(kw))) return "component";
  if (existsSync(join(process.cwd(), "design-system.md"))) return "page";
  return "full";
}

let data: { hook_event_name?: string; agent_type?: string; agent_id?: string; prompt?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (data.hook_event_name !== "SubagentStart") process.exit(0);
if (!(data.agent_type ?? "").includes("design")) process.exit(0);
const agentId = data.agent_id ?? "";
if (!agentId) process.exit(0);

mkdirSync(CACHE_DIR, { recursive: true });
const dsExists = existsSync(join(process.cwd(), "design-system.md"));
const state = defaultState(agentId, detectMode(data.prompt ?? ""), dsExists);
// init writes created_at == updated_at; write directly (saveState would re-stamp).
const now = isoNow();
state.created_at = now;
state.updated_at = now;
writeFileSync(join(CACHE_DIR, `.design-state-${agentId}.json`), JSON.stringify(state, null, 2), "utf8");
process.exit(0);
