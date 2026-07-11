/**
 * validate-apex-workflow.test.ts — freshness-gate regression test.
 * state.changes is cumulative for the whole session lifetime (24h
 * housekeeping only), so a state with a fresh lastCheck (within the 30min
 * APEX window) must still warn on a missing step, while a stale lastCheck
 * must exit clean instead of re-firing the warning on every later Stop.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AGENT_TTL_MS } from "../../_shared/apex-agents";

const SCRIPT = join(import.meta.dir, "..", "validate-apex-workflow.native.ts");
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((r) => rm(r, { force: true, recursive: true })));
});

function writeState(codexHome: string, sid: string, state: unknown): void {
  const dir = join(codexHome, "fusengine", "sessions");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `session-${sid}.json`), JSON.stringify(state));
}

async function run(codexHome: string, payload: unknown): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", SCRIPT], {
    env: { ...process.env, CODEX_HOME: codexHome },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();
  const [stdout, exitCode] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
  return { stdout, exitCode };
}

test("fresh changes + missing sniper still warns", async () => {
  const codexHome = mkdtempSync(join(tmpdir(), "apex-fresh-"));
  roots.push(codexHome);
  const sid = "fresh-sess";
  writeState(codexHome, sid, {
    changes: { modifiedFiles: ["src/foo.ts"], lastCheck: new Date().toISOString() },
    agents: [
      { type: "explore-codebase", quality: "sufficient" },
      { type: "research-expert", quality: "sufficient" },
    ],
  });
  const { stdout, exitCode } = await run(codexHome, { session_id: sid });
  expect(exitCode).toBe(0);
  expect(stdout).toContain("sniper validation after modifications");
});

test("stale changes (older than the 30min TTL) exit clean, no warning", async () => {
  const codexHome = mkdtempSync(join(tmpdir(), "apex-stale-"));
  roots.push(codexHome);
  const sid = "stale-sess";
  const stale = new Date(Date.now() - AGENT_TTL_MS - 60_000).toISOString();
  writeState(codexHome, sid, {
    changes: { modifiedFiles: ["src/foo.ts"], lastCheck: stale },
    agents: [],
  });
  const { stdout, exitCode } = await run(codexHome, { session_id: sid });
  expect(exitCode).toBe(0);
  expect(stdout).toBe("");
});
