#!/usr/bin/env bun
// @hook-entry
/**
 * detect-duplication.native.ts — native TS port of the nextjs-expert
 * detect-duplication wrapper, which delegates to the shared DRY blocker. All
 * logic lives in the shared runDuplicationGuard (bundled); this is the thin
 * stdin → guard entry, matching the Python wrapper's delegation 1:1.
 */
import { runDuplicationGuard } from "../../_shared/scripts/dry-duplication";
import type { HookInput } from "../../ai-pilot/scripts/lib/apex/interfaces/hook.interface";

let data: HookInput;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

runDuplicationGuard(data);
