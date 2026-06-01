#!/usr/bin/env bun
// @hook-entry
/**
 * track-solid-reads.native.ts — native TS port of
 * _legacy_py/post-tool-use/track-solid-reads.py.
 *
 * PostToolUse: when a Read (or cat/grep-style Bash) touches a solid-* skill
 * reference, append an entry to state.solid_reads tagged with the framework.
 * State keys, regex extraction and timestamp format match the Python.
 */
import { loadSessionState, saveSessionState } from "../_shared/state-manager";
import { utcStamp } from "../_shared/track-time";

const FRAMEWORK_MAP: Record<string, string> = {
  "solid-nextjs": "nextjs", "solid-react": "react",
  "solid-php": "php", "solid-swift": "swift",
  "solid-generic": "generic", "solid-java": "java",
  "solid-go": "go", "solid-ruby": "ruby", "solid-rust": "rust",
};

interface Payload {
  tool_name?: string;
  session_id?: string;
  tool_input?: { file_path?: string; command?: string; input?: string };
}

/** Extract candidate solid-* paths from a Read file_path or a cat/grep command. */
function filePathsFromPayload(data: Payload): string[] {
  const ti = data.tool_input ?? {};
  const fp = ti.file_path ?? "";
  if (data.tool_name === "Read" && fp) return [fp];
  const command = ti.command || ti.input || "";
  if (!command) return [];
  if (!/\b(cat|sed|nl|less|head|tail|bat|rg|grep)\b/.test(command)) return [];
  const re = /(?:~|\/|\.)?[^\s"']*solid-[^\s"']+\/(?:references\/[^\s"']+|SKILL\.md)/g;
  return command.match(re) ?? [];
}

let data: Payload;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const sid = data.session_id || "unknown";
const paths = filePathsFromPayload(data);
if (paths.length === 0) process.exit(0);

const state = loadSessionState(sid);
const solidReads = (state.solid_reads ??= []) as unknown[];

for (const fp of paths) {
  if (!/solid-[^/]+\/(references\/|SKILL\.md)/.test(fp)) continue;
  let framework = "";
  for (const [key, val] of Object.entries(FRAMEWORK_MAP)) {
    if (fp.includes(key)) { framework = val; break; }
  }
  if (!framework) continue;
  solidReads.push({ timestamp: utcStamp(), framework, session: sid, file: fp });
}

saveSessionState(sid, state);
process.exit(0);
