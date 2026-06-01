#!/usr/bin/env bun
// @hook-entry
/**
 * check-shadcn-install.native.ts — native TS port of
 * _legacy_py/check-shadcn-install.py.
 *
 * The Python computes a shadcn-install check and discards the result (it never
 * writes to stdout or any state), so the hook is observationally a no-op: it
 * only validates stdin and exits 0. Project/shadcn detection for the gates lives
 * in the shared expert-skill-gate / shadcn-patterns modules. Kept as a registered
 * hook so hooks.json wiring is preserved 1:1 with the Python.
 */
let data: { tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

// Mirror the Python early-exit on a missing file_path; the rest produced no
// observable effect (computed shadcn-install state was discarded).
void (data.tool_input?.file_path ?? "");
process.exit(0);
