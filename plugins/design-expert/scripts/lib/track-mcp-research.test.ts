/**
 * track-mcp-research.test.ts — dual-form server regression: Codex emits
 * mcp__fuse_browser__… / mcp__gemini_design__… (dash → underscore), so the
 * query derivation and per-agent track line must fire for both spellings.
 */
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "track-mcp-research.native.ts");
const ROOTS: string[] = [];
const NAV = { tool_input: { url: "https://example.com" } };

afterEach(async () => {
  await Promise.all(ROOTS.splice(0).map((r) => rm(r, { force: true, recursive: true })));
});

function track(agentId: string, events: object[]): string {
  const codexHome = mkdtempSync(join(tmpdir(), "mcp-research-"));
  ROOTS.push(codexHome);
  for (const event of events) {
    const result = Bun.spawnSync(["bun", SCRIPT], {
      env: { ...process.env, CODEX_HOME: codexHome },
      stdio: [new TextEncoder().encode(JSON.stringify({ session_id: "s", agent_id: agentId, ...event })), "pipe", "pipe"],
    });
    expect(result.exitCode).toBe(0);
  }
  try {
    return readFileSync(join(codexHome, "fusengine", "skill-tracking", `agent-${agentId}`), "utf8");
  } catch {
    return "";
  }
}

test("dash-form fuse-browser navigate appends the agent track line", () => {
  const log = track("a1", [{ tool_name: "mcp__fuse-browser__browser_navigate", ...NAV }]);
  expect(log).toContain("mcp__fuse-browser__browser_navigate");
  expect(log).toContain("https://example.com");
});

test("underscore-form fuse-browser navigate appends the agent track line", () => {
  const log = track("a2", [{ tool_name: "mcp__fuse_browser__browser_navigate", ...NAV }]);
  expect(log).toContain("mcp__fuse_browser__browser_navigate");
  expect(log).toContain("https://example.com");
});

test("underscore navigate then scroll leaves a scroll line after the last nav", () => {
  const log = track("a3", [
    { tool_name: "mcp__fuse_browser__browser_navigate", ...NAV },
    { tool_name: "mcp__fuse_browser__browser_scroll", ...NAV },
  ]);
  const lines = log.split("\n");
  const lastNav = lines.findLastIndex((l) => l.includes("browser_navigate"));
  expect(lastNav).toBeGreaterThanOrEqual(0);
  expect(lines.slice(lastNav + 1).some((l) => l.includes("browser_scroll"))).toBe(true);
});

test("underscore screenshot derives the fullPage query", () => {
  const log = track("a4", [{ tool_name: "mcp__fuse_browser__browser_screenshot", tool_input: { fullPage: true } }]);
  expect(log).toContain("fuse_browser_screenshot true");
});

test("underscore-form gemini-design appends the agent track line", () => {
  const log = track("a5", [{ tool_name: "mcp__gemini_design__create_frontend", tool_input: { query: "hero" } }]);
  expect(log).toContain("mcp__gemini_design__create_frontend");
});
