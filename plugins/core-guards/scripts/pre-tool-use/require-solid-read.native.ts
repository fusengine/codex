#!/usr/bin/env bun
// @hook-entry
/**
 * require-solid-read.native.ts — native TS port of
 * _legacy_py/pre-tool-use/require-solid-read.py.
 *
 * Unconditionally requires reading the routed SOLID refs before editing code —
 * distinct from enforce-apex-phases, which bypasses the SOLID requirement once
 * docs are consulted. Reuses the shared ref-router + rollout solidRefRead;
 * framework/skill-dir/state helpers are local (bundle-safe). Deny JSON is
 * byte-identical to the Python.
 */
import { loadSessionState, saveSessionState } from "../_shared/state-manager";
import { framework, resolveSkillDir, alreadyRead, SKILL_MAP } from "../_shared/solid-read-helpers";
import { routeReferences } from "../../../ai-pilot/scripts/lib/apex/ref-router";
import { solidRefRead } from "../../../ai-pilot/scripts/lib/apex/rollout-evidence";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|go|rs|java|php|cpp|c|rb|swift|kt|dart|vue|svelte|astro)$/;

interface ToolInput { command?: string; input?: string; file_path?: string; }

function* filesIn(tool: string, ti: ToolInput): Generator<string> {
  if (tool === "apply_patch") {
    for (const line of String(ti.command ?? ti.input ?? "").split("\n")) {
      const m = line.match(/^\*\*\*\s+(Add|Update) File:\s+(.+)$/);
      if (m) yield m[2]!.trim();
    }
  } else if (ti.file_path) {
    yield ti.file_path;
  }
}

async function buildReason(fp: string, fw: string, skillDir: string): Promise<string> {
  const routed = await routeReferences(fp, "", skillDir);
  if (!routed) return `BLOCKED: Read SOLID first (2min): ${skillDir}/SKILL.md`;
  const ln = [`BLOCKED: Read SOLID refs (2min) for ${fw}.`, `Editing: ${fp}`, "Required:"];
  routed.required.forEach((r, i) => ln.push(`  ${i + 1}. ${r.meta.filePath}`));
  if (routed.optional.length) {
    ln.push("Optional:");
    routed.optional.forEach((r, i) => ln.push(`  ${routed.required.length + i + 1}. ${r.meta.filePath}`));
  }
  ln.push(`Full: ${skillDir}/SKILL.md`);
  return ln.join("\n");
}

function deny(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  }));
  process.exit(0);
}

let data: { tool_name?: string; session_id?: string; tool_input?: ToolInput };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tool = data.tool_name ?? "";
const sid = data.session_id ?? "";
for (const fp of filesIn(tool, data.tool_input ?? {})) {
  if (!CODE_EXT.test(fp)) continue;
  const fw = framework(fp);
  const skillDir = resolveSkillDir(SKILL_MAP[fw] ?? "");
  if (!fw || alreadyRead(sid, fw) || solidRefRead(sid, skillDir)) continue;
  if (sid) {
    try {
      const state = loadSessionState(sid);
      state.target = {
        project: fp.slice(0, fp.lastIndexOf("/")), framework: fw,
        set_by: "require-solid-read.native.ts", set_at: new Date().toISOString(),
      };
      saveSessionState(sid, state);
    } catch { /* best-effort bookkeeping for track-doc-consultation */ }
  }
  deny(await buildReason(fp, fw, skillDir));
}
process.exit(0);
