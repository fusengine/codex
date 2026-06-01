#!/usr/bin/env bun
// @hook-entry
/**
 * detect-creation-intent.native.ts — native TS port of
 * _legacy_py/user-prompt/detect-creation-intent.py.
 *
 * UserPromptSubmit: set state.brainstorming_required = true when the prompt has
 * a creation keyword and no skip keyword, else false. Regexes and the state key
 * are verbatim from the Python for strict parity. No stdout (state side-effect).
 */
import { loadSessionState, saveSessionState } from "../_shared/state-manager";

const CREATION = /\b(create|implement|add|build|new|feature|component|generate|make|develop|scaffold)\b/i;
const SKIP = /\b(fix|bug|debug|update|refactor|rename|move|delete|remove|commit|push|status|edit|modify|change|adjust|tweak|existing|current)\b/i;

let data: { prompt?: string; session_id?: string };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const prompt = data.prompt ?? "";
const sid = data.session_id || "unknown";
const required = Boolean(prompt) && CREATION.test(prompt) && !SKIP.test(prompt);

try {
  const state = loadSessionState(sid);
  state.brainstorming_required = required;
  saveSessionState(sid, state);
} catch {
  /* best-effort, mirrors python exit 0 on state errors */
}
process.exit(0);
