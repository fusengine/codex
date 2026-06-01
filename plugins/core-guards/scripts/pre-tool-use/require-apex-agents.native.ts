#!/usr/bin/env bun
// @hook-entry
/**
 * require-apex-agents.native.ts — native TS port of
 * _legacy_py/pre-tool-use/require-apex-agents.py.
 *
 * PreToolUse(apply_patch): block code writes unless explore-codebase +
 * research-expert ran this turn (and brainstorming, for new files by the lead).
 * Deny strings and JSON shape are byte-identical to the Python for parity.
 */
import { checkRequiredAgents, checkBrainstormDone } from "../_shared/apex-agents";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$/;
const EXEMPT = [
  /\.codex-plugin\//,
  /CHANGELOG\.md$/,
  /marketplace\.json$/,
  /\/\.codex\/(apex|memory|logs|fusengine)\//,
  /\/\.codex\/(apex|memory|fusengine)\//,
];

interface ToolInput {
  command?: string;
  input?: string;
  file_path?: string;
}

function* filesIn(tool: string, ti: ToolInput): Generator<[string, boolean]> {
  if (tool === "apply_patch") {
    for (const line of String(ti.command ?? ti.input ?? "").split("\n")) {
      const m = line.match(/^\*\*\*\s+(Add|Update) File:\s+(.+)$/);
      if (m) yield [m[2].trim(), m[1] === "Add"];
    }
  } else {
    const fp = ti.file_path ?? "";
    if (fp) yield [fp, tool !== "Edit"];
  }
}

function deny(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
    systemMessage: `require-apex-agents: ${reason.split("\n")[0].slice(0, 180)}`,
  }));
  process.exit(0);
}

let data: { tool_name?: string; session_id?: string; agent_id?: string; tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "";
const sid = data.session_id || "unknown";
const isSub = Boolean(data.agent_id);

for (const [fp, isNew] of filesIn(tool, data.tool_input ?? {})) {
  if (!CODE_EXT.test(fp) || EXEMPT.some((p) => p.test(fp))) continue;
  if (isNew && !isSub && !checkBrainstormDone(sid)) {
    deny("BLOCKED: Brainstorming required for new feature/creation task. Launch brainstorming agent BEFORE writing code.");
  }
  const { satisfied, missing } = checkRequiredAgents(sid);
  if (satisfied) continue;
  const missingStr = missing.join(" + ");
  if (isSub) {
    const hints: string[] = [];
    for (const m of missing) {
      if (m.includes("explore")) hints.push("Glob/Grep (codebase exploration)");
      if (m.includes("research")) hints.push("Context7/Exa/WebSearch (research)");
    }
    deny(`BLOCKED: APEX workflow required (3min TTL). Missing: ${missingStr}. Use ${hints.join(" and ")} BEFORE editing code.`);
  } else {
    deny(`BLOCKED: APEX workflow required (3min TTL). Missing agents: ${missingStr}. Launch BOTH explore-codebase AND research-expert BEFORE editing code.`);
  }
}
process.exit(0);
