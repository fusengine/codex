#!/usr/bin/env bun
// @hook-entry
/**
 * capture-agent-lesson.native.ts — native TS port of
 * _legacy_py/capture-agent-lesson.py.
 *
 * SubagentStop: skip errored/empty stops and explore-codebase/websearch, append
 * an "[ts] <agent> | <reason> | <lesson80>..." line to agent-lessons.log, then
 * POST a Graphiti episode when salience clears 0.30. The skip set, severity
 * ladder, truncations (1000 lesson / 80 log) and salience are verbatim.
 */
import { appendFileSync } from "node:fs";
import { postGraphiti, utcTs, memoryLogDir, salience } from "./lib/neural";

/** Severity by agent type (verbatim ladder). */
function agentSeverity(name: string): number {
  if (name === "sniper" || name === "sniper-faster") return 8;
  if (name === "research-expert") return 6;
  if (name.endsWith("-expert")) return 7;
  return 5;
}

const logDir = memoryLogDir();

let data: { agent_name?: string; last_assistant_message?: string; exit_reason?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const agentName = data.agent_name ?? "unknown";
const lastMsg = data.last_assistant_message ?? "";
const exitReason = data.exit_reason ?? "unknown";

if (!lastMsg || exitReason === "error") process.exit(0);
if (agentName === "explore-codebase" || agentName === "websearch") process.exit(0);

const lesson = lastMsg.slice(0, 1000);
const ts = utcTs();

try {
  appendFileSync(`${logDir}/agent-lessons.log`, `[${ts}] ${agentName} | ${exitReason} | ${lesson.slice(0, 80)}...\n`);
} catch { /* ignore */ }

const sev = agentSeverity(agentName);
if (salience(sev) <= 0.30) process.exit(0);

await postGraphiti("/episodes", {
  name: "agent_lesson",
  episode_body: `Agent ${agentName} conclusion: ${lesson}`,
  source_description: `agent-stop-${agentName}`,
  reference_time: ts,
});
process.exit(0);
