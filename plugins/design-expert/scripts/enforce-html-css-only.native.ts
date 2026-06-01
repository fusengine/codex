#!/usr/bin/env bun
// @hook-entry
/**
 * enforce-html-css-only.native.ts — native TS port of
 * _legacy_py/enforce-html-css-only.py.
 *
 * PreToolUse: when the active design agent edits files, allow only
 * .html/.css/.md/.json (exempt node_modules/dist/build/.codex); deny framework
 * files. allow_pass only fires when at least one non-exempt target was checked.
 */
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import { gatedAgentId } from "./lib/design-state";
import { allowPass } from "../../core-guards/scripts/_shared/hook-output-post";

const ALLOWED_EXT = /\.(html|css|md|json)$/;
const EXEMPT_DIRS = ["node_modules/", "dist/", "build/", ".codex/"];
const DENY_MSG =
  "BLOCKED: design-expert can only write .html, .css, .md, and .json files. "
  + "Framework files (.tsx, .astro, .vue, .swift, .php) must be written by "
  + "the domain expert (astro-expert, react-expert, etc.) AFTER design validation.";

let data: { agent_id?: string; tool_name?: string; tool_input?: Record<string, unknown> };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

if (gatedAgentId(data.agent_id ?? "") === null) process.exit(0);

let checked = false;
for (const target of editTargets(data)) {
  const fp = target.filePath;
  if (!fp || EXEMPT_DIRS.some((d) => fp.includes(d))) continue;
  checked = true;
  if (!ALLOWED_EXT.test(fp)) {
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: DENY_MSG },
    }));
    process.exit(0);
  }
}
if (checked) allowPass("enforce-html-css-only", "allowed design files");
process.exit(0);
