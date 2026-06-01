#!/usr/bin/env bun
// @hook-entry
/**
 * validate-solid.native.ts — native TS port of _legacy_py/validate-solid.py.
 *
 * PreToolUse(apply_patch): deny edits that put interfaces/protocols/abstract
 * classes outside the per-stack location for the detected SOLID_PROJECT_TYPE.
 * Edit-target extraction reuses the shared ai-pilot editTargets (bundled), and
 * the per-stack regexes + deny strings are verbatim from the Python.
 */
import { editTargets } from "../../ai-pilot/scripts/lib/apex/edit-targets";
import type { HookInput } from "../../ai-pilot/scripts/lib/apex/interfaces/hook.interface";

type Validator = (filePath: string, content: string) => void;

/** Emit a PreToolUse deny decision and exit (parity with deny_solid). */
function denySolid(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

const VALIDATORS: Record<string, Validator> = {
  nextjs(filePath, content) {
    const hasIface = /^(export )?(interface|type) /m.test(content);
    if (filePath.includes("/components/") && hasIface) {
      denySolid("SOLID: Interfaces must be in modules/cores/interfaces/, not components");
    }
    if (filePath.includes("/app/") && filePath.endsWith(".tsx") && hasIface) {
      denySolid("SOLID: Interfaces must be in modules/cores/interfaces/, not app/");
    }
  },
  laravel(filePath, content) {
    if (filePath.endsWith(".php") && !filePath.includes("/Contracts/") && /^interface /m.test(content)) {
      denySolid("SOLID: Interfaces must be in app/Contracts/");
    }
  },
  swift(filePath, content) {
    if (filePath.endsWith(".swift") && !filePath.includes("/Protocols/") && /^protocol /m.test(content)) {
      denySolid("SOLID: Protocols must be in Protocols/");
    }
  },
  go(filePath, content) {
    if (filePath.endsWith(".go") && !filePath.includes("/interfaces/") && /^type.*interface \{/m.test(content)) {
      denySolid("SOLID: Interfaces must be in internal/interfaces/");
    }
  },
  python(filePath, content) {
    if (filePath.endsWith(".py") && !filePath.includes("/interfaces/") && /class.*ABC/.test(content)) {
      denySolid("SOLID: Abstract classes must be in src/interfaces/");
    }
  },
};

const ptype = process.env.SOLID_PROJECT_TYPE ?? "";
if (!ptype || ptype === "unknown") process.exit(0);

let data: HookInput;
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const validator = VALIDATORS[ptype];
if (validator) {
  for (const t of editTargets(data)) {
    if (t.filePath && t.content) validator(t.filePath, t.content);
  }
}
process.exit(0);
