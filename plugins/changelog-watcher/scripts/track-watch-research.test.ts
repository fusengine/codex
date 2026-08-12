/**
 * track-watch-research.test.ts — dual-form regression: Codex emits
 * mcp__fuse_browser__… (dash → underscore), so fuse-browser research events
 * must be recorded for both spellings.
 */
import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "track-watch-research.native.ts");
const ROOTS: string[] = [];

afterEach(async () => {
  await Promise.all(ROOTS.splice(0).map((r) => rm(r, { force: true, recursive: true })));
});

function run(codexHome: string, toolName: string): void {
  const result = Bun.spawnSync(["bun", SCRIPT], {
    env: { ...process.env, CODEX_HOME: codexHome },
    stdio: [new TextEncoder().encode(JSON.stringify({
      tool_name: toolName, tool_input: { url: "https://example.com" },
    })), "pipe", "pipe"],
  });
  expect(result.exitCode).toBe(0);
}

function recorded(toolName: string): { tool?: string }[] {
  const codexHome = mkdtempSync(join(tmpdir(), "watch-research-"));
  ROOTS.push(codexHome);
  run(codexHome, toolName);
  const today = new Date().toISOString().slice(0, 10);
  const file = join(codexHome, "logs", "00-changelog", `${today}-research.json`);
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")).queries ?? [];
}

test("dash-form fuse-browser tool is recorded", () => {
  expect(recorded("mcp__fuse-browser__browser_navigate").map((e) => e.tool))
    .toEqual(["mcp__fuse-browser__browser_navigate"]);
});

test("underscore-form fuse-browser tool is recorded (Codex sanitized)", () => {
  expect(recorded("mcp__fuse_browser__browser_navigate").map((e) => e.tool))
    .toEqual(["mcp__fuse_browser__browser_navigate"]);
});

test("unrelated MCP tool is ignored", () => {
  expect(recorded("mcp__magic__21st_magic_component_builder")).toEqual([]);
});
