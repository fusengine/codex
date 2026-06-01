#!/usr/bin/env bun
// @hook-entry
/**
 * check-solid-from-transcript.native.ts — native TS port of
 * _legacy_py/check-solid-from-transcript.py.
 *
 * SubagentStop: read the subagent transcript, collect Write/Edit file_paths,
 * check each code file's line count + interface placement and emit a
 * SubagentStop additionalContext warning. File iteration is sorted (matching
 * Python's sorted(files)); messages and JSON match the Python.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { countFileCodeLines } from "./lib/solid-lines";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|php|swift|go|rs|rb|java|astro)$/;
const INTERFACE_RE = /^(export )?(interface|type) [A-Z]/m;

interface ToolUse { type?: string; name?: string; input?: { file_path?: string } }
interface Msg { message?: { content?: ToolUse[] } }

let data: { agent_transcript_path?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const transcript = data.agent_transcript_path ?? "";
if (!transcript || !existsSync(transcript)) process.exit(0);

let trData: unknown;
try {
  trData = JSON.parse(readFileSync(transcript, "utf8"));
} catch {
  process.exit(0);
}

const messages: Msg[] = Array.isArray(trData) ? (trData as Msg[]) : [trData as Msg];
const files = new Set<string>();
for (const msg of messages) {
  for (const content of msg.message?.content ?? []) {
    if (content.type !== "tool_use") continue;
    if (content.name !== "Write" && content.name !== "Edit") continue;
    const fp = content.input?.file_path ?? "";
    if (fp) files.add(fp);
  }
}

const violations: string[] = [];
for (const fp of [...files].sort()) {
  if (!existsSync(fp) || !CODE_EXT.test(fp)) continue;
  const lc = countFileCodeLines(fp);
  const name = basename(fp);
  if (lc > 100) violations.push(`SOLID: ${name} = ${lc} lines (max 100)`);
  for (const prefix of ["components/", "pages/", "views/", "app/"]) {
    if (fp.includes(prefix)) {
      if (INTERFACE_RE.test(readFileSync(fp, "utf8"))) {
        violations.push(`SOLID: ${name} has interfaces (move to interfaces/)`);
      }
      break;
    }
  }
}

if (!violations.length) process.exit(0);

const warn = "## SOLID VIOLATIONS DETECTED (subagent output)\n"
  + violations.join("\n") + "\nRun sniper to fix these issues.";
console.log(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SubagentStop", additionalContext: warn },
}));
