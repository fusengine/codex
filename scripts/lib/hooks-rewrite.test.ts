import { expect, test } from "bun:test";
import { rewriteCommand } from "./hooks-rewrite";

test("rewrites Codex home paths with a default fallback", () => {
	expect(rewriteCommand("bun ${CODEX_HOME}/node_modules/hook.js")).toBe(
		"bun ${CODEX_HOME:-$HOME/.codex}/node_modules/hook.js",
	);
	expect(rewriteCommand("bun ${CLAUDE_HOME}/node_modules/hook.js")).toBe(
		"bun ${CODEX_HOME:-$HOME/.codex}/node_modules/hook.js",
	);
	expect(rewriteCommand("bun $CODEX_HOME/node_modules/hook.js")).toBe(
		"bun ${CODEX_HOME:-$HOME/.codex}/node_modules/hook.js",
	);
	expect(rewriteCommand("bun ${CODEX_HOME:-$HOME/.codex}/node_modules/hook.js")).toBe(
		"bun ${CODEX_HOME:-$HOME/.codex}/node_modules/hook.js",
	);
});
