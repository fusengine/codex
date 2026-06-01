#!/usr/bin/env bun
// @hook-entry
/**
 * track-agent-memory.native.ts — native TS port of
 * _legacy_py/subagent-stop/track-agent-memory.py.
 *
 * SubagentStop: record the finished sub-agent into session state + a global
 * JSONL history, then (for non-skipped agents that changed code) emit a sniper
 * prompt and reset the legacy changes file. State keys, quality rule, skip
 * regex, JSONL shape and messages are faithful to the Python.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadSessionState, saveSessionState } from "../_shared/state-manager";
import { utcStamp } from "../_shared/track-time";

const STATE_DIR = join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "fusengine", "sessions");
const MEMORY_DIR = join(homedir(), ".codex", "memory", "agents");
const SKIP_AGENTS = /(sniper|sniper-faster|explore-codebase|research-expert|claude-code-guide|Explore|Plan)/;

interface Payload {
  session_id?: string; agent_id?: string; agent_type?: string;
  subagent_type?: string; last_assistant_message?: string;
}

/** Quality: sniper agents pass only when the message starts with PASS. */
function agentQuality(agentType: string, message: string): string {
  if (/sniper/i.test(agentType)) return message.trim().startsWith("PASS") ? "sufficient" : "insufficient";
  return "sufficient";
}

mkdirSync(STATE_DIR, { recursive: true });
mkdirSync(MEMORY_DIR, { recursive: true });

let data: Payload;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  console.log(JSON.stringify({ message: "Invalid input" }));
  process.exit(0);
}

const agentId = data.agent_id ?? "unknown";
const agentType = data.agent_type ?? data.subagent_type ?? "unknown";
const sid = data.session_id ?? "unknown";
const timestamp = utcStamp();

const message = data.last_assistant_message ?? "";
const state = loadSessionState(sid);
const agents = (state.agents ??= []) as unknown[];
agents.push({
  timestamp, type: agentType, agent_id: data.agent_id ?? "unknown",
  tool_name: "SubagentStop", response_length: message.length,
  quality: agentQuality(agentType, message),
});
saveSessionState(sid, state);

try {
  appendFileSync(join(MEMORY_DIR, "agent-history.jsonl"),
    JSON.stringify({ agentId, agentType, completedAt: timestamp }) + "\n");
} catch { /* ignore */ }

if (SKIP_AGENTS.test(agentType)) {
  console.log(JSON.stringify({ message: `Agent ${agentType} completed` }));
  process.exit(0);
}

const stateFile = join(STATE_DIR, `session-${sid}-changes.json`);
if (existsSync(stateFile)) {
  try {
    const changes = JSON.parse(readFileSync(stateFile, "utf-8"));
    const count = changes.cumulativeCodeFiles ?? 0;
    if (count > 0) {
      const files = (changes.modifiedFiles ?? []).join(", ");
      changes.cumulativeCodeFiles = 0;
      writeFileSync(stateFile, JSON.stringify(changes));
      console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SubagentStop",
        additionalContext: `SNIPER VALIDATION REQUIRED: Agent '${agentType}' ` +
          `modified ${count} code file(s): ${files}. Run sniper agent now.` } }));
      process.exit(0);
    }
  } catch { /* fall through */ }
}

console.log(JSON.stringify({ message: `Agent ${agentType} completed (no code changes)` }));
process.exit(0);
