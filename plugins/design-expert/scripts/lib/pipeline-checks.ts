/**
 * pipeline-checks.ts — phase-gate checks ported from pipeline_checks.py.
 *
 * Each check denies (with the exact Python RECOVERY message) when the pipeline
 * state is not yet ready for the requested action; otherwise returns. Uses the
 * shared design-state deny + MIN_SCREENSHOTS.
 */
import { deny, MIN_SCREENSHOTS, type DesignState } from "./design-state";

/** Gate: writing design-system.md requires phase >= 2 and enough screenshots. */
export function checkDesignSystemWrite(state: DesignState): void {
  const mode = state.mode ?? "full";
  const needed = MIN_SCREENSHOTS[mode] ?? 4;
  const count = state.screenshots_count ?? 0;
  const phase = state.current_phase ?? 0;
  if (phase < 2) {
    deny(
      `BLOCKED: Cannot write design-system.md at phase ${phase}. `
      + "RECOVERY: 1) Read identity templates from skills/0-identity-system/ "
      + "2) Read design-inspiration.md 3) Browse and screenshot sites "
      + "4) Then write design-system.md");
  }
  if (count < needed) {
    deny(
      `BLOCKED: ${count}/${needed} screenshots for mode '${mode}'. `
      + `RECOVERY: 1) Take ${needed - count} more fuse-browser screenshots `
      + "2) Use browser_navigate + browser_screenshot fullPage:true "
      + "3) Then write design-system.md");
  }
}

/** Gate: Gemini create_frontend requires phase >= 3 and a valid design system. */
export function checkGeminiCreate(state: DesignState): void {
  if ((state.current_phase ?? 0) < 3) {
    deny(
      "BLOCKED: Cannot call Gemini create_frontend before phase 3. "
      + "RECOVERY: 1) Complete screenshot browsing phase "
      + "2) Write a valid design-system.md "
      + "3) Then call mcp__gemini-design__create_frontend");
  }
  if (!state.design_system_valid) {
    deny(
      "BLOCKED: design-system.md not validated. "
      + "RECOVERY: 1) Ensure design-system.md has ## Design Reference, "
      + "OKLCH tokens, typography pair, reference URL "
      + "2) Then retry mcp__gemini-design__create_frontend");
  }
}

/** Gate: fuse-browser navigate requires phase >= 1 and inspiration read. */
export function checkBrowserNavigate(state: DesignState): void {
  if ((state.current_phase ?? 0) < 1) {
    deny(
      "BLOCKED: Cannot browse before phase 1. "
      + "RECOVERY: 1) Read identity templates "
      + "2) Read design-inspiration.md first "
      + "3) Then use mcp__fuse-browser__browser_navigate");
  }
  if (!state.inspiration_read) {
    deny(
      "BLOCKED: design-inspiration.md not read yet. "
      + "RECOVERY: 1) Read design-inspiration.md "
      + "2) Read design-inspiration-urls.md "
      + "3) Choose 4 URLs then browse");
  }
}
