#!/usr/bin/env bun
// @hook-entry
/**
 * check-shadcn-install.native.ts — native TS port of
 * _legacy_py/check-shadcn-install.py.
 *
 * The Python computes a shadcn-install check and discards the result (it never
 * writes to stdout or any state), so the hook is observationally a no-op: it
 * only validates stdin + a present file_path, then exits 0. Kept as a registered
 * hook so the wiring is preserved 1:1 with the Python.
 */
let data: { tool_input?: { file_path?: string } };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

void (data.tool_input?.file_path ?? "");
process.exit(0);
