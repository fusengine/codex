import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findTasteFirstMarker, tasteFirstBypassActive, tasteFirstPreLock } from "./taste-first";

const SCRIPTS = join(import.meta.dir, "..");
const EVENT_NAV = {
  session_id: "taste-test", agent_id: "agent-1", tool_input: { url: "https://example.com" },
  tool_name: "mcp__fuse-browser__browser_navigate",
};
const EVENT_NAV_US = { ...EVENT_NAV, tool_name: "mcp__fuse_browser__browser_navigate" };
const EVENT_GEMINI = { agent_id: "agent-1", tool_name: "mcp__gemini-design__create_frontend" };
const EVENT_GEMINI_US = { agent_id: "agent-1", tool_name: "mcp__gemini_design__create_frontend" };
const EVENT_TSX = {
  agent_id: "agent-1", session_id: "taste-test", tool_name: "Write",
  tool_input: { file_path: "src/components/Hero.tsx", content: "export const Hero = () => <section className=\"flex\">Hero</section>;" },
};

interface Fixture { codexHome: string; cwd: string; markerPath: string }

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "taste-first-"));
  const project = join(root, "project");
  const cwd = join(project, "src", "deep", "path");
  const codexHome = join(root, "codex");
  mkdirSync(join(project, ".harness", "apex"), { recursive: true });
  mkdirSync(join(codexHome, "fusengine"), { recursive: true });
  mkdirSync(cwd, { recursive: true });
  writeFileSync(join(codexHome, "fusengine", "design-agent-active"), "agent-1");
  return { codexHome, cwd, markerPath: join(project, ".harness", "apex", "taste-first.json") };
}

function marker(f: Fixture, firstFrameLocked: boolean, active: boolean): void {
  writeFileSync(f.markerPath, JSON.stringify({
    lane: "taste-first", register: "brand", move: "generate", firstFrameLocked, active,
    ownerAgentId: "agent-1",
  }));
}

function hook(f: Fixture, script: string, event: object): string {
  const result = Bun.spawnSync(["bun", join(SCRIPTS, script)], {
    cwd: f.cwd,
    env: { ...process.env, CODEX_HOME: f.codexHome },
    stdio: [new TextEncoder().encode(JSON.stringify(event)), "pipe", "pipe"],
  });
  expect(result.exitCode).toBe(0);
  return result.stdout.toString();
}

test("marker state is fail-closed and supports deep paths", () => {
  const f = fixture();
  writeFileSync(f.markerPath, JSON.stringify({
    lane: "taste-first", register: "brand", move: "generate", firstFrameLocked: false,
    ownerAgentId: "agent-1",
  }));
  expect(tasteFirstBypassActive(f.cwd, "agent-1")).toBe(false);
  marker(f, false, true);
  expect(tasteFirstBypassActive(f.cwd, "agent-1")).toBe(true);
  expect(tasteFirstPreLock(f.cwd, "agent-1")).toBe(true);
  marker(f, true, true);
  expect(tasteFirstBypassActive(f.cwd, "agent-1")).toBe(true);
  expect(tasteFirstPreLock(f.cwd, "agent-1")).toBe(false);
  marker(f, true, false);
  expect(findTasteFirstMarker(f.cwd, "agent-1")).toBeNull();
});

test("pre-lock bypasses obsolete gates and lock restores design-system validation", () => {
  const f = fixture();
  marker(f, false, true);
  for (const ev of [EVENT_NAV, EVENT_NAV_US]) expect(hook(f, "check-inspiration-read.native.ts", ev)).toBe("");
  for (const ev of [EVENT_NAV, EVENT_NAV_US]) expect(hook(f, "pipeline-gate.native.ts", ev)).toBe("");
  for (const ev of [EVENT_GEMINI, EVENT_GEMINI_US]) expect(hook(f, "validate-design-system.native.ts", ev)).toBe("");
  expect(hook(f, "check-design-skill.native.ts", EVENT_TSX)).toBe("");
  marker(f, true, true);
  for (const ev of [EVENT_GEMINI, EVENT_GEMINI_US]) expect(hook(f, "validate-design-system.native.ts", ev)).toContain("design-system.md not found");
  const lockedBypasses = [hook(f, "check-inspiration-read.native.ts", EVENT_NAV), hook(f, "pipeline-gate.native.ts", EVENT_NAV), hook(f, "check-design-skill.native.ts", EVENT_TSX)];
  expect(lockedBypasses).toEqual(["", "", ""]);
});

test("inactive marker preserves the legacy pipeline gate (dash + underscore)", () => {
  const f = fixture();
  marker(f, true, false);
  for (const ev of [EVENT_NAV, EVENT_NAV_US]) {
    const output = hook(f, "pipeline-gate.native.ts", ev);
    expect(output).not.toContain("taste-first bypass");
    expect(output).toContain("BLOCKED:");
    expect(hook(f, "check-inspiration-read.native.ts", ev)).toContain("BLOCKED: Phase 0 not done");
  }
});

test("cleanup deactivates an interrupted task marker", () => {
  const f = fixture();
  marker(f, false, true);
  const event = { hook_event_name: "SubagentStop", agent_type: "design-expert", agent_id: "agent-1" };
  expect(hook(f, "design-state-cleanup.native.ts", event)).toBe("");
  expect(tasteFirstBypassActive(f.cwd, "agent-1")).toBe(false);
});
