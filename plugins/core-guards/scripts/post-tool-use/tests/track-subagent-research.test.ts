/**
 * track-subagent-research.test.ts — RESEARCH_TOOLS dual-form regression:
 * Codex sanitizes `-` → `_` across the full MCP tool id, so context7 tools
 * arrive as mcp__context7__query_docs / mcp__context7__resolve_library_id;
 * both forms (and underscore-native exa tools) must be credited.
 */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "track-subagent-research.native.ts");
const ROOTS: string[] = [];
const RESPONSE = "x".repeat(60);

afterEach(async () => {
  await Promise.all(ROOTS.splice(0).map((r) => rm(r, { force: true, recursive: true })));
});

async function run(codexHome: string, toolName: string): Promise<void> {
  const proc = Bun.spawn(["bun", SCRIPT], {
    env: { ...process.env, CODEX_HOME: codexHome },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  proc.stdin.write(JSON.stringify({
    tool_name: toolName, session_id: "sess", agent_id: "agent-1", tool_response: RESPONSE,
  }));
  proc.stdin.end();
  expect(await proc.exited).toBe(0);
}

function readAgents(codexHome: string): { type?: string }[] {
  try {
    const path = join(codexHome, "fusengine", "sessions", "session-sess.json");
    const state = JSON.parse(readFileSync(path, "utf-8"));
    return Array.isArray(state.agents) ? state.agents : [];
  } catch {
    return [];
  }
}

async function credited(toolName: string): Promise<string[]> {
  const codexHome = mkdtempSync(join(tmpdir(), "research-"));
  ROOTS.push(codexHome);
  await run(codexHome, toolName);
  return readAgents(codexHome).map((a) => a.type ?? "");
}

test("dash-form context7 tools are credited", async () => {
  for (const tool of ["mcp__context7__query-docs", "mcp__context7__resolve-library-id"]) {
    expect(await credited(tool)).toEqual(["subagent-research-expert"]);
  }
});

test("underscore-form context7 tools are credited (Codex sanitized)", async () => {
  for (const tool of ["mcp__context7__query_docs", "mcp__context7__resolve_library_id"]) {
    expect(await credited(tool)).toEqual(["subagent-research-expert"]);
  }
});

test("underscore-native exa tools still credited; unknown tools ignored", async () => {
  expect(await credited("mcp__exa__web_search_exa")).toEqual(["subagent-research-expert"]);
  expect(await credited("mcp__context7__other_thing")).toEqual([]);
});
