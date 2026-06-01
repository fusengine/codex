#!/usr/bin/env bun
/**
 * test-sessions-pattern.ts — validates the fusengine/sessions DENY_PATTERNS entry.
 * Native Bun test (port of _legacy_py/tests/test-sessions-pattern.py).
 */
import { test, expect } from "bun:test";

const PATTERN = /fusengine\/sessions/;

const CASES: Array<[string, boolean, string]> = [
  ["cat ~/.codex/fusengine/sessions/abc.json", true, "read session file"],
  ["echo x > ~/.codex/fusengine/sessions/foo", true, "write session file"],
  ["rm -rf ~/.codex/fusengine/sessions/", true, "delete sessions dir"],
  ["ls fusengine/sessions", true, "ls sessions relative"],
  ["bun run test", false, "safe bun run"],
  ["git status", false, "safe git"],
  ["npx eslint .", false, "safe eslint"],
  ["ls ~/.codex/fusengine/", false, "parent dir only"],
];

for (const [cmd, expected, label] of CASES) {
  test(`sessions pattern — ${label}`, () => {
    expect(PATTERN.test(cmd)).toBe(expected);
  });
}
