/**
 * expert-skill-gate.ts — bundle-safe TS port of _shared/scripts/check_skill_common.py
 * (+ mcp_research.mcp_research_done). The PreToolUse skill gates for the expert
 * plugins (tailwind/swift/security/react/shadcn/nextjs/laravel/design) share
 * this surface: was the base/specific skill consulted (APEX state OR rollout),
 * and was MCP research done. Deny JSON is byte-identical to the Python.
 */
import { resolve, dirname, join } from "node:path";
import { existsSync } from "node:fs";
import {
  frameworkAuthorization, sessionAuthorized, apexMcpResearchDone,
} from "./apex-state-read";
import {
  docConsultedInTranscript, skillRead,
} from "../../../ai-pilot/scripts/lib/apex/rollout-evidence";

/**
 * Walk up from start_dir checking for any marker file (mirrors
 * check_skill_common.find_project_root). Falls back to cwd.
 * @param startDir - Directory to start from.
 * @param markers - Marker filenames to look for.
 */
export function findProjectRootMarkers(startDir: string, ...markers: string[]): string {
  let d = resolve(startDir);
  while (d !== "/") {
    for (const marker of markers) {
      if (existsSync(join(d, marker))) return d;
    }
    d = dirname(d);
  }
  return process.cwd();
}

/** code_mode fallback: Context7+Exa research seen in the rollout tree. */
function rolloutDoc(sessionId: string): boolean {
  try {
    return docConsultedInTranscript(sessionId);
  } catch {
    return false;
  }
}

/** True if a file under skills/<skillName>/ was read in the rollout tree.
 * Delegates to the canonical skillRead in rollout-evidence (single source). */
function rolloutSkillRead(sessionId: string, skillName: string): boolean {
  try {
    return skillRead(sessionId, skillName);
  } catch {
    return false;
  }
}

/**
 * Base skill consulted via APEX state, or doc research in the rollout (PostToolUse
 * does not fire in code_mode — openai/codex#19385). Mirrors skill_was_consulted.
 */
export function skillWasConsulted(framework: string, sessionId: string): boolean {
  const entry = frameworkAuthorization(framework);
  return sessionAuthorized(entry, sessionId) || rolloutDoc(sessionId);
}

/**
 * Specific skill read via APEX state sources, or via the rollout tree
 * (mirrors specific_skill_consulted).
 */
export function specificSkillConsulted(framework: string, skillName: string, sessionId: string): boolean {
  const entry = frameworkAuthorization(framework);
  const sources = (entry.sources as string[]) ?? [];
  if (sessionAuthorized(entry, sessionId) &&
      sources.some((s) => String(s).includes(`skills/${skillName}/`))) {
    return true;
  }
  return rolloutSkillRead(sessionId, skillName);
}

/**
 * Recent Context7 + Exa research from the APEX state, falling back to the
 * rollout tree (mirrors mcp_research.mcp_research_done).
 */
export function mcpResearchDone(sessionId: string): boolean {
  return apexMcpResearchDone(sessionId) || rolloutDoc(sessionId);
}

/** Emit a PreToolUse deny block and exit (mirrors deny_block). */
export function denyBlock(reason: string): never {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}
