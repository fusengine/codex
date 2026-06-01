/**
 * ralph-mode.ts — shared Ralph-mode detection for git-guard and install-guard,
 * ported verbatim from is_ralph_mode() in git-guard.py / install-guard.py.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

/**
 * True when Ralph autonomous mode is active: RALPH_MODE=1, a Ralph PRD file
 * exists, or the current git branch starts with "feature/".
 * @returns Whether Ralph mode is active.
 */
export function isRalphMode(): boolean {
  if (process.env.RALPH_MODE === "1") return true;
  if (existsSync(".codex/ralph/prd.json")) return true;
  try {
    const r = spawnSync("git", ["branch", "--show-current"], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    if (r.status !== 0 || typeof r.stdout !== "string") return false;
    return r.stdout.trim().startsWith("feature/");
  } catch {
    return false;
  }
}
