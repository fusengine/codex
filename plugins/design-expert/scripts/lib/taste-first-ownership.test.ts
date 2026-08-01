import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findTasteFirstMarker, tasteFirstBypassActive } from "./taste-first";

const FLAG_SCRIPT = join(import.meta.dir, "..", "design-agent-flag.native.ts");

function writeMarker(path: string, ownerAgentId: string, active = true): void {
  mkdirSync(join(path, ".harness", "apex"), { recursive: true });
  writeFileSync(join(path, ".harness", "apex", "taste-first.json"), JSON.stringify({
    lane: "taste-first",
    register: "brand",
    move: "redesign",
    firstFrameLocked: false,
    active,
    ownerAgentId,
  }));
}

function flagHook(codexHome: string, hook_event_name: string, agent_id: string): void {
  const event = { hook_event_name, agent_type: "design-expert", agent_id };
  const result = Bun.spawnSync(["bun", FLAG_SCRIPT], {
    env: { ...process.env, CODEX_HOME: codexHome },
    stdio: [new TextEncoder().encode(JSON.stringify(event)), "pipe", "pipe"],
  });
  expect(result.exitCode).toBe(0);
}

test("nearest marker is a task boundary for concurrent owners", () => {
  const root = mkdtempSync(join(tmpdir(), "taste-owners-"));
  const nested = join(root, "nested");
  const cwd = join(nested, "src", "deep");
  mkdirSync(cwd, { recursive: true });
  writeMarker(root, "agent-parent");
  writeMarker(nested, "agent-nested");
  expect(findTasteFirstMarker(cwd, "agent-nested")?.ownerAgentId).toBe("agent-nested");
  expect(findTasteFirstMarker(cwd, "agent-parent")).toBeNull();
});

test("inactive or incomplete nearest marker cannot inherit an active ancestor", () => {
  const root = mkdtempSync(join(tmpdir(), "taste-stale-"));
  const nested = join(root, "nested");
  const markerPath = join(nested, ".harness", "apex", "taste-first.json");
  mkdirSync(join(nested, ".harness", "apex"), { recursive: true });
  writeMarker(root, "agent-1");
  writeFileSync(markerPath, JSON.stringify({
    lane: "taste-first", register: "brand", move: "generate",
    firstFrameLocked: false, ownerAgentId: "agent-1",
  }));
  expect(tasteFirstBypassActive(nested, "agent-1")).toBe(false);
  writeMarker(nested, "agent-1", false);
  expect(tasteFirstBypassActive(nested, "agent-1")).toBe(false);
});

test("stopping one design agent cannot clear another agent's active flag", () => {
  const root = mkdtempSync(join(tmpdir(), "taste-flag-"));
  const codexHome = join(root, "codex");
  const flagPath = join(codexHome, "fusengine", "design-agent-active");
  flagHook(codexHome, "SubagentStart", "agent-1");
  flagHook(codexHome, "SubagentStart", "agent-2");
  flagHook(codexHome, "SubagentStop", "agent-1");
  expect(readFileSync(flagPath, "utf8")).toBe("agent-2");
  flagHook(codexHome, "SubagentStop", "agent-2");
  expect(existsSync(flagPath)).toBe(false);
});

test("stopping the newest design agent restores the previous active owner", () => {
  const root = mkdtempSync(join(tmpdir(), "taste-flag-stack-"));
  const codexHome = join(root, "codex");
  const flagPath = join(codexHome, "fusengine", "design-agent-active");
  flagHook(codexHome, "SubagentStart", "agent-1");
  flagHook(codexHome, "SubagentStart", "agent-2");
  flagHook(codexHome, "SubagentStop", "agent-2");
  expect(readFileSync(flagPath, "utf8")).toBe("agent-1");
  flagHook(codexHome, "SubagentStop", "agent-1");
  expect(existsSync(flagPath)).toBe(false);
});
