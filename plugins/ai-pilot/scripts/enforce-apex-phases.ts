/**
 * enforce-apex-phases.ts - PreToolUse hook.
 * Blocks Write/Edit/apply_patch on code files unless documentation was consulted
 * within the same session and within the last 3 minutes.
 */
import { readStdin } from "./lib/core";
import { emitPreToolDeny } from "./lib/hook-output";
import { acquireLock, ensureStateDir, stateFilePath, loadState, saveState } from "./lib/apex/state";
import type { HookInput } from "./lib/interfaces/hook.interface";
import { detectFramework, getSkillSource, getSkillDir, formatRoutedDeny } from "./lib/apex/enforce-helpers";
import { findProjectRoot } from "./lib/apex/fs-helpers";
import { isDocConsulted, formatDocDeny, resolveSessions, type AuthEntry } from "./lib/apex/doc-helpers";
import { docConsultedInTranscript } from "./lib/apex/rollout-evidence";
import { routeReferences } from "./lib/apex/ref-router";
import { incrementTrivialEditCounter } from "./lib/apex/trivial-edit-counter";
import { editTargets } from "./lib/apex/edit-targets";

const CODE_EXT = /\.(ts|tsx|js|jsx|py|php|swift|go|rs|rb|java|vue|svelte|astro|css)$/;
const SKIP_DIRS = /(node_modules|vendor|dist|build|\.next|DerivedData)/;
const PROTECTED_PATHS = /\.codex\/(plugins\/(marketplaces|cache)|fusengine\/(logs\/00-apex|skill-tracking))/;

async function deny(reason: string): Promise<void> {
  await emitPreToolDeny("enforce-apex-phases", reason);
}

function isAuthorized(
  auth: (AuthEntry & { doc_consulted?: string }) | undefined,
  sessionId: string,
): boolean {
  if (!auth?.doc_consulted || !resolveSessions(auth).includes(sessionId)) {
    return false;
  }
  const readEpoch = new Date(auth.doc_consulted).getTime();
  return !Number.isNaN(readEpoch) && (Date.now() - readEpoch) < 180_000;
}

async function checkTarget(filePath: string, content: string, sessionId: string): Promise<void> {
  // code_mode-proof: the rollout is ground truth when per-tool PostToolUse never
  // fired (openai/codex#19385). If both doc sources appear there within the TTL,
  // the consultation happened — allow, regardless of the state file.
  if (docConsultedInTranscript(sessionId)) return;
  const projectRoot = findProjectRoot(filePath.replace(/\/[^/]+$/, ""));
  const framework = detectFramework(filePath, content);
  await ensureStateDir();
  const statePath = stateFilePath();
  const unlock = await acquireLock(`${statePath}.lockdir`);
  if (!unlock) return;
  try {
    const state = await loadState(statePath);
    const auth = state.authorizations[framework];
    if (!isAuthorized(auth, sessionId)) {
      state.target = { project: projectRoot, framework, set_by: "enforce-apex-phases.ts", set_at: new Date().toISOString() };
      await saveState(statePath, state);
      const routed = await routeReferences(filePath, content, getSkillDir(framework));
      await deny(routed ? formatRoutedDeny(framework, filePath, routed) :
        `APEX: Read doc first (expires every 3min) for ${framework}! Source: ${getSkillSource(framework)}`);
      return;
    }
    if (!isDocConsulted(state.authorizations, sessionId)) await deny(formatDocDeny(framework));
  } finally {
    await unlock();
  }
}

async function main(): Promise<void> {
  const input = (await readStdin()) as HookInput;
  const sessionId = input.session_id ?? "";
  for (const { filePath, content, isTrivialEdit } of editTargets(input)) {
    if (PROTECTED_PATHS.test(filePath)) {
      await deny("[APEX Hook Guard] Write blocked - this path is managed automatically by APEX hooks.");
      return;
    }
    if (!CODE_EXT.test(filePath) || SKIP_DIRS.test(filePath)) continue;
    if (isTrivialEdit && await incrementTrivialEditCounter(sessionId) < 5) continue;
    await checkTarget(filePath, content, sessionId);
  }
}
await main();
