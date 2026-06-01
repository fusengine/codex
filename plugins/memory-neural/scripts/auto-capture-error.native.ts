#!/usr/bin/env bun
// @hook-entry
/**
 * auto-capture-error.native.ts — native TS port of _legacy_py/auto-capture-error.py.
 *
 * PostToolUse(Bash): on a non-zero exit with stderr, compute severity/salience,
 * POST a Graphiti episode (best-effort) and print a <memory-capture> block when
 * salience clears 0.30. Severity keywords, the 500-char truncation, the salience
 * formula and the printed block (2-decimal salience) are verbatim from the Python.
 */
import { postGraphiti, utcTs, salience } from "./lib/neural";

const SALIENCE_THRESHOLD = 0.30;

/** Severity 1-10 from stderr keywords (verbatim ladder). */
function severity(stderr: string): number {
  const s = stderr.toLowerCase();
  if (["fatal", "panic"].some((k) => s.includes(k))) return 10;
  if (["error", "failed"].some((k) => s.includes(k))) return 8;
  if (s.includes("warning")) return 4;
  if (s.includes("deprecated")) return 2;
  return 5;
}

interface ToolResult { exit_code?: unknown; stderr?: string; }

let data: { tool_result?: ToolResult };
try {
  data = JSON.parse(await Bun.stdin.text());
} catch {
  process.exit(0);
}

const tr = data.tool_result ?? {};
const exitCode = String(tr.exit_code ?? "0");
const stderr = tr.stderr ?? "";
if (exitCode === "0" || !stderr) process.exit(0);

const sev = severity(stderr);
const sal = salience(sev);
if (sal <= SALIENCE_THRESHOLD) process.exit(0);

const errorMsg = stderr.slice(0, 500);
await postGraphiti("/episodes", {
  name: "bash_error",
  episode_body: `Bash error (exit ${exitCode}): ${errorMsg}`,
  source_description: "auto-capture",
  reference_time: utcTs(),
});

console.log(`<memory-capture salience="${sal.toFixed(2)}" severity="${sev}">`);
console.log("Error captured in neural memory (Graphiti).");
console.log(`Search for similar past errors: use mcp__qdrant__qdrant-find with query "${errorMsg}"`);
console.log("If you solve this, store the solution: use mcp__qdrant__qdrant-store");
console.log("</memory-capture>");
