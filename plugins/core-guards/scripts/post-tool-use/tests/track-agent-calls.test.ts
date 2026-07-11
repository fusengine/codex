/**
 * track-agent-calls.test.ts — Codex V2 multi-agent spawn detection
 * regression test. tool_name arrives as the bare "spawn_agent", or as
 * "{namespace}spawn_agent" concatenated with NO separator when the
 * namespace_tools capability is active; only these (plus Claude's "Agent")
 * are credited into state.agents — an unrelated tool that merely ends in
 * a different suffix must not be.
 */
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "track-agent-calls.native.ts");
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((r) => rm(r, { force: true, recursive: true })));
});

async function run(codexHome: string, payload: unknown): Promise<number> {
  const proc = Bun.spawn(["bun", SCRIPT], {
    env: { ...process.env, CODEX_HOME: codexHome },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();
  return await proc.exited;
}

function readAgents(codexHome: string, sid: string): unknown[] {
  const path = join(codexHome, "fusengine", "sessions", `session-${sid}.json`);
  const state = JSON.parse(readFileSync(path, "utf-8"));
  return Array.isArray(state.agents) ? state.agents : [];
}

test("bare spawn_agent with agent_type=sniper is credited sufficient", async () => {
  const codexHome = mkdtempSync(join(tmpdir(), "spawn-bare-"));
  roots.push(codexHome);
  const sid = "bare-sess";
  await run(codexHome, {
    tool_name: "spawn_agent",
    session_id: sid,
    tool_input: { agent_type: "sniper", prompt: "validate the diff" },
  });
  const agents = readAgents(codexHome, sid) as { type?: string; quality?: string }[];
  expect(agents.length).toBe(1);
  expect(agents[0]?.type).toBe("sniper");
  expect(agents[0]?.quality).toBe("sufficient");
});

test("namespace-concatenated fusengine_agentsspawn_agent is credited", async () => {
  const codexHome = mkdtempSync(join(tmpdir(), "spawn-ns-"));
  roots.push(codexHome);
  const sid = "ns-sess";
  await run(codexHome, {
    tool_name: "fusengine_agentsspawn_agent",
    session_id: sid,
    tool_input: { agent_type: "sniper", prompt: "validate the diff" },
  });
  const agents = readAgents(codexHome, sid) as { type?: string; quality?: string }[];
  expect(agents.length).toBe(1);
  expect(agents[0]?.type).toBe("sniper");
  expect(agents[0]?.quality).toBe("sufficient");
});

test("spawn_agentX is not a real spawn tool — no entry recorded", async () => {
  const codexHome = mkdtempSync(join(tmpdir(), "spawn-notreal-"));
  roots.push(codexHome);
  const sid = "notreal-sess";
  await run(codexHome, {
    tool_name: "spawn_agentX",
    session_id: sid,
    tool_input: { agent_type: "sniper" },
  });
  // isSpawn is false, so the hook exits before ever touching session state.
  expect(() => readAgents(codexHome, sid)).toThrow();
});
