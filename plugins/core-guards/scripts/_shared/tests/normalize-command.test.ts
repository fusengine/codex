/**
 * normalize-command.test.ts — verifies normalizeCommand is a no-op on the
 * string payload shape (Claude Code/Cursor/Hermes) and correctly extracts the
 * script from the Codex CLI `[shell, "-lc"|"-c", script]` argv shape, joining
 * or dropping other shapes rather than throwing.
 */
import { test, expect } from "bun:test";
import { normalizeCommand } from "../normalize-command";

test("string payload is returned as-is", () => {
  expect(normalizeCommand("git commit -m test")).toBe("git commit -m test");
});

test("Codex argv [bash, -lc, script] extracts the script", () => {
  expect(normalizeCommand(["bash", "-lc", "git commit -m test"])).toBe("git commit -m test");
});

test("Codex argv [sh, -c, script] extracts the script", () => {
  expect(normalizeCommand(["sh", "-c", "rm -rf /tmp/x"])).toBe("rm -rf /tmp/x");
});

test("other string[] shapes are space-joined, not dropped", () => {
  expect(normalizeCommand(["git", "commit", "-m", "test"])).toBe("git commit -m test");
});

test("empty array yields empty string", () => {
  expect(normalizeCommand([])).toBe("");
});

test("undefined/non-string/non-array input yields empty string, never throws", () => {
  expect(normalizeCommand(undefined)).toBe("");
  expect(normalizeCommand(null)).toBe("");
  expect(normalizeCommand(42)).toBe("");
  expect(normalizeCommand({ command: "git commit" })).toBe("");
});
